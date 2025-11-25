# 외부 체인 NFT 소유권 검증을 통한 플래그 추가

## 📋 목차
1. [개요](#개요)
2. [핵심 개념](#핵심-개념)
3. [시스템 아키텍처](#시스템-아키텍처)
4. [기술적 구현](#기술적-구현)
5. [배포 가이드](#배포-가이드)
6. [보안 고려사항](#보안-고려사항)
7. [테스트 시나리오](#테스트-시나리오)

---

## 개요

### 목적
다른 블록체인에 존재하는 NFT의 소유권을 검증하여, 타겟 체인에서 사용자에게 특정 플래그(권한, 뱃지, 접근권 등)를 부여하는 시스템

### 유스케이스
- Ethereum의 BAYC 보유자에게 Polygon 게임 내 특별 아이템 지급
- Optimism의 DAO NFT 보유자에게 Arbitrum 거버넌스 투표권 부여
- Base의 멤버십 NFT 보유자에게 다른 체인의 프리미엄 기능 활성화

### 기술 스택
- **Chainlink CCIP**: 크로스체인 메시징
- **Solidity 0.8.x**: 스마트 컨트랙트
- **ERC-721**: NFT 표준
- **Attestation Pattern**: 온체인 증명 메커니즘

---

## 핵심 개념

### 1. Attestation (온체인 증명)

**정의**: 스마트 컨트랙트가 특정 사실을 온체인에 기록한 증명서

```solidity
struct Attestation {
    address nftContract;      // NFT 컨트랙트 주소
    uint256 tokenId;          // 토큰 ID
    address owner;            // 소유자 주소
    uint256 timestamp;        // 증명 생성 시각
    uint256 blockNumber;      // 블록 번호
    uint64 sourceChainId;     // 소스 체인 식별자
}
```

**서명과의 차이점**:
- ❌ 서명: Private key로 생성하는 암호학적 증거 (컨트랙트는 불가능)
- ✅ Attestation: 컨트랙트가 검증 후 발급하는 온체인 증명서

### 2. CCIP (Chainlink Cross-Chain Interoperability Protocol)

**역할**:
1. 크로스체인 메시지 전송
2. 메시지 무결성 보장 (DON 합의)
3. 송신자 인증 정보 제공

**보안 레이어**:
```
CCIP 메시지 = {
    sender: 0xAAA...,           // 송신 컨트랙트 주소
    sourceChainSelector: 5009...// 소스 체인 ID
    data: encodedAttestation,   // Attestation 데이터
    signature: DON_signature    // 노드들의 합의 서명
}
```

### 3. 화이트리스트 기반 신뢰 모델

```solidity
// 타겟 체인에서 신뢰할 수 있는 Verifier만 등록
mapping(uint64 => mapping(address => bool)) public trustedVerifiers;

// 체인별 신뢰 등록 예시:
// Ethereum(5009297550715157269) -> 0x123...(Verifier) -> true
// Optimism(3734403246176062136) -> 0x456...(Verifier) -> true
```

---

## 시스템 아키텍처

### 전체 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│ Source Chain (Ethereum)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User owns NFT #123                                         │
│     ↓                                                          │
│  2. NFTVerifier.createAttestation()                           │
│     ├─ IERC721.ownerOf(123) == msg.sender ✓                  │
│     ├─ Generate attestationId                                 │
│     └─ Store Attestation on-chain                             │
│     ↓                                                          │
│  3. NFTVerifier.bridgeAttestation()                           │
│     └─ CCIP Router.ccipSend()                                 │
│                                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    CCIP Network
                    (DON Consensus)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│ Target Chain (Polygon)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  4. FlagReceiver._ccipReceive()                                │
│     ├─ Verify sender in whitelist ✓                           │
│     ├─ Verify CCIP signature ✓ (automatic)                    │
│     └─ Store received Attestation                              │
│     ↓                                                          │
│  5. FlagReceiver.grantFlag()                                   │
│     ├─ Check Attestation validity                             │
│     ├─ Check timestamp freshness                              │
│     └─ Grant flag to user                                      │
│                                                                 │
│  6. Application checks hasFlag(user)                           │
│     └─ Allow premium features ✓                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 컴포넌트 구조

```
Project Root
├── contracts/
│   ├── source/
│   │   └── NFTOwnershipVerifier.sol      // Source chain 검증 컨트랙트
│   ├── target/
│   │   └── FlagReceiver.sol               // Target chain 플래그 관리
│   └── interfaces/
│       ├── ICCIPRouter.sol
│       └── IFlagReceiver.sol
├── scripts/
│   ├── deploy-source.js
│   ├── deploy-target.js
│   └── setup-whitelist.js
└── test/
    ├── NFTVerifier.test.js
    └── integration.test.js
```

---

## 기술적 구현

### Source Chain: NFT 소유권 검증 컨트랙트

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTOwnershipVerifier
 * @notice Source chain에서 NFT 소유권을 검증하고 Attestation을 생성하여 CCIP로 전송
 */
contract NFTOwnershipVerifier is Ownable {
    IRouterClient public immutable ccipRouter;
    
    // Attestation 구조체
    struct Attestation {
        address nftContract;
        uint256 tokenId;
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        uint64 sourceChainSelector;
        bytes32 attestationId;
    }
    
    // attestationId => Attestation
    mapping(bytes32 => Attestation) public attestations;
    
    // 사용자별 nonce (리플레이 공격 방지)
    mapping(address => uint256) public nonces;
    
    // 지원하는 NFT 컨트랙트 화이트리스트
    mapping(address => bool) public supportedNFTs;
    
    // Events
    event AttestationCreated(
        bytes32 indexed attestationId,
        address indexed owner,
        address nftContract,
        uint256 tokenId
    );
    
    event AttestationBridged(
        bytes32 indexed attestationId,
        uint64 indexed destinationChain,
        address receiver,
        bytes32 messageId
    );
    
    constructor(address _ccipRouter) {
        ccipRouter = IRouterClient(_ccipRouter);
    }
    
    /**
     * @notice NFT 컨트랙트를 지원 목록에 추가
     */
    function addSupportedNFT(address nftContract) external onlyOwner {
        require(nftContract != address(0), "Invalid address");
        supportedNFTs[nftContract] = true;
    }
    
    /**
     * @notice NFT 소유권을 검증하고 Attestation 생성
     * @param nftContract NFT 컨트랙트 주소
     * @param tokenId 토큰 ID
     * @return attestationId 생성된 Attestation의 고유 ID
     */
    function createAttestation(
        address nftContract,
        uint256 tokenId
    ) external returns (bytes32 attestationId) {
        require(supportedNFTs[nftContract], "NFT not supported");
        
        // 1. 실제 소유권 검증
        address actualOwner = IERC721(nftContract).ownerOf(tokenId);
        require(actualOwner == msg.sender, "Not the owner");
        
        // 2. 고유한 attestationId 생성
        attestationId = keccak256(abi.encodePacked(
            block.chainid,
            nftContract,
            tokenId,
            msg.sender,
            nonces[msg.sender]++,
            block.timestamp,
            block.number
        ));
        
        // 3. Attestation 저장
        attestations[attestationId] = Attestation({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            sourceChainSelector: uint64(block.chainid),
            attestationId: attestationId
        });
        
        emit AttestationCreated(attestationId, msg.sender, nftContract, tokenId);
        
        return attestationId;
    }
    
    /**
     * @notice Attestation을 CCIP를 통해 타겟 체인으로 전송
     * @param attestationId 전송할 Attestation ID
     * @param destinationChainSelector 타겟 체인 선택자
     * @param receiver 타겟 체인의 수신 컨트랙트 주소
     * @return messageId CCIP 메시지 ID
     */
    function bridgeAttestation(
        bytes32 attestationId,
        uint64 destinationChainSelector,
        address receiver
    ) external payable returns (bytes32 messageId) {
        Attestation memory attestation = attestations[attestationId];
        require(attestation.timestamp > 0, "Attestation not found");
        require(attestation.owner == msg.sender, "Not attestation owner");
        
        // Attestation 유효성 재검증 (NFT가 여전히 소유하고 있는지)
        address currentOwner = IERC721(attestation.nftContract).ownerOf(attestation.tokenId);
        require(currentOwner == msg.sender, "No longer the owner");
        
        // CCIP 메시지 구성
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(attestationId, attestation),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 300_000})
            ),
            feeToken: address(0) // Native token으로 수수료 지불
        });
        
        // 수수료 계산
        uint256 fee = ccipRouter.getFee(destinationChainSelector, message);
        require(msg.value >= fee, "Insufficient fee");
        
        // CCIP로 전송
        messageId = ccipRouter.ccipSend{value: fee}(
            destinationChainSelector,
            message
        );
        
        // 잔액 반환
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
        
        emit AttestationBridged(attestationId, destinationChainSelector, receiver, messageId);
        
        return messageId;
    }
    
    /**
     * @notice Attestation이 여전히 유효한지 확인 (현재 소유자 체크)
     */
    function isAttestationStillValid(bytes32 attestationId) 
        external 
        view 
        returns (bool) 
    {
        Attestation memory attestation = attestations[attestationId];
        if (attestation.timestamp == 0) return false;
        
        address currentOwner = IERC721(attestation.nftContract).ownerOf(attestation.tokenId);
        return currentOwner == attestation.owner;
    }
    
    /**
     * @notice CCIP 수수료 계산
     */
    function estimateFee(
        bytes32 attestationId,
        uint64 destinationChainSelector,
        address receiver
    ) external view returns (uint256 fee) {
        Attestation memory attestation = attestations[attestationId];
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: abi.encode(attestationId, attestation),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 300_000})
            ),
            feeToken: address(0)
        });
        
        return ccipRouter.getFee(destinationChainSelector, message);
    }
}
```

### Target Chain: 플래그 관리 컨트랙트

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FlagReceiver
 * @notice Target chain에서 Attestation을 수신하고 사용자에게 플래그 부여
 */
contract FlagReceiver is CCIPReceiver, Ownable {
    
    // 받은 Attestation 구조체 (Source chain과 동일)
    struct ReceivedAttestation {
        address nftContract;
        uint256 tokenId;
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        uint64 sourceChainSelector;
        bytes32 attestationId;
        uint256 receivedAt;  // 타겟 체인 수신 시각
        bool used;           // 플래그 발급 여부
    }
    
    // 플래그 정보
    struct UserFlag {
        bytes32 attestationId;
        uint256 grantedAt;
        uint256 expiresAt;
        bool active;
    }
    
    // attestationId => ReceivedAttestation
    mapping(bytes32 => ReceivedAttestation) public receivedAttestations;
    
    // user => flagType => UserFlag
    mapping(address => mapping(bytes32 => UserFlag)) public userFlags;
    
    // 신뢰할 수 있는 Verifier 주소
    // sourceChainSelector => verifier address => trusted
    mapping(uint64 => mapping(address => bool)) public trustedVerifiers;
    
    // Attestation 최대 유효 기간 (기본: 1시간)
    uint256 public constant MAX_ATTESTATION_AGE = 1 hours;
    
    // 플래그 유효 기간 (기본: 30일)
    uint256 public defaultFlagDuration = 30 days;
    
    // Events
    event AttestationReceived(
        bytes32 indexed attestationId,
        address indexed owner,
        uint64 sourceChain
    );
    
    event FlagGranted(
        address indexed user,
        bytes32 indexed flagType,
        bytes32 indexed attestationId,
        uint256 expiresAt
    );
    
    event FlagRevoked(
        address indexed user,
        bytes32 indexed flagType
    );
    
    event TrustedVerifierSet(
        uint64 indexed sourceChain,
        address indexed verifier,
        bool trusted
    );
    
    constructor(address _ccipRouter) CCIPReceiver(_ccipRouter) {}
    
    /**
     * @notice 신뢰할 수 있는 Verifier 등록
     */
    function setTrustedVerifier(
        uint64 sourceChainSelector,
        address verifier,
        bool trusted
    ) external onlyOwner {
        require(verifier != address(0), "Invalid verifier");
        trustedVerifiers[sourceChainSelector][verifier] = trusted;
        emit TrustedVerifierSet(sourceChainSelector, verifier, trusted);
    }
    
    /**
     * @notice 플래그 유효 기간 설정
     */
    function setFlagDuration(uint256 duration) external onlyOwner {
        require(duration > 0 && duration <= 365 days, "Invalid duration");
        defaultFlagDuration = duration;
    }
    
    /**
     * @notice CCIP 메시지 수신 (내부 함수)
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        address sender = abi.decode(message.sender, (address));
        uint64 sourceChain = message.sourceChainSelector;
        
        // 🔒 보안: 신뢰할 수 있는 송신자인지 검증
        require(
            trustedVerifiers[sourceChain][sender],
            "Untrusted verifier"
        );
        
        // Attestation 데이터 디코딩
        (bytes32 attestationId, ReceivedAttestation memory attestation) = abi.decode(
            message.data,
            (bytes32, ReceivedAttestation)
        );
        
        // 중복 체크
        require(
            receivedAttestations[attestationId].receivedAt == 0,
            "Attestation already received"
        );
        
        // Attestation 저장
        attestation.receivedAt = block.timestamp;
        attestation.used = false;
        receivedAttestations[attestationId] = attestation;
        
        emit AttestationReceived(attestationId, attestation.owner, sourceChain);
    }
    
    /**
     * @notice 사용자에게 플래그 부여
     * @param attestationId Attestation ID
     * @param flagType 플래그 타입 (예: "PREMIUM_ACCESS", "DAO_MEMBER")
     */
    function grantFlag(
        bytes32 attestationId,
        bytes32 flagType
    ) external {
        ReceivedAttestation storage attestation = receivedAttestations[attestationId];
        
        // Attestation 존재 여부
        require(attestation.receivedAt > 0, "Attestation not found");
        
        // 이미 사용되었는지 체크
        require(!attestation.used, "Attestation already used");
        
        // Attestation 신선도 체크 (너무 오래되지 않았는지)
        require(
            block.timestamp - attestation.timestamp <= MAX_ATTESTATION_AGE,
            "Attestation too old"
        );
        
        // 호출자가 Attestation 소유자인지 확인
        require(attestation.owner == msg.sender, "Not attestation owner");
        
        // 플래그 부여
        userFlags[msg.sender][flagType] = UserFlag({
            attestationId: attestationId,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + defaultFlagDuration,
            active: true
        });
        
        // Attestation 사용 표시
        attestation.used = true;
        
        emit FlagGranted(
            msg.sender,
            flagType,
            attestationId,
            block.timestamp + defaultFlagDuration
        );
    }
    
    /**
     * @notice 사용자가 특정 플래그를 가지고 있는지 확인
     */
    function hasFlag(
        address user,
        bytes32 flagType
    ) external view returns (bool) {
        UserFlag memory flag = userFlags[user][flagType];
        
        return flag.active && 
               flag.expiresAt > block.timestamp;
    }
    
    /**
     * @notice 플래그 취소 (관리자만)
     */
    function revokeFlag(
        address user,
        bytes32 flagType
    ) external onlyOwner {
        require(userFlags[user][flagType].active, "Flag not active");
        
        userFlags[user][flagType].active = false;
        
        emit FlagRevoked(user, flagType);
    }
    
    /**
     * @notice Attestation 정보 조회
     */
    function getAttestation(bytes32 attestationId) 
        external 
        view 
        returns (ReceivedAttestation memory) 
    {
        return receivedAttestations[attestationId];
    }
    
    /**
     * @notice 사용자의 플래그 정보 조회
     */
    function getUserFlag(address user, bytes32 flagType)
        external
        view
        returns (UserFlag memory)
    {
        return userFlags[user][flagType];
    }
}
```

### 인터페이스 정의

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFlagReceiver {
    struct UserFlag {
        bytes32 attestationId;
        uint256 grantedAt;
        uint256 expiresAt;
        bool active;
    }
    
    function hasFlag(address user, bytes32 flagType) external view returns (bool);
    function getUserFlag(address user, bytes32 flagType) external view returns (UserFlag memory);
}
```

---

## 배포 가이드

### 1. 환경 변수 설정

```bash
# .env
# Source Chain (Ethereum Sepolia)
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ETHEREUM_PRIVATE_KEY=0x...
ETHEREUM_CCIP_ROUTER=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59

# Target Chain (Polygon Mumbai)
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
POLYGON_PRIVATE_KEY=0x...
POLYGON_CCIP_ROUTER=0x1035CabC275068e0F4b745A29CEDf38E13aF41b1

# Chain Selectors
ETHEREUM_SEPOLIA_SELECTOR=16015286601757825753
POLYGON_MUMBAI_SELECTOR=12532609583862916517

# NFT Contract
NFT_CONTRACT_ADDRESS=0x...
```

### 2. Source Chain 배포

```javascript
// scripts/deploy-source.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying NFTVerifier with:", deployer.address);
    
    const ccipRouter = process.env.ETHEREUM_CCIP_ROUTER;
    
    const NFTVerifier = await ethers.getContractFactory("NFTOwnershipVerifier");
    const verifier = await NFTVerifier.deploy(ccipRouter);
    await verifier.deployed();
    
    console.log("NFTVerifier deployed to:", verifier.address);
    
    // NFT 컨트랙트 등록
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS;
    await verifier.addSupportedNFT(nftAddress);
    console.log("Supported NFT added:", nftAddress);
    
    // 배포 정보 저장
    const deployment = {
        network: "ethereum-sepolia",
        verifier: verifier.address,
        ccipRouter: ccipRouter,
        timestamp: new Date().toISOString()
    };
    
    require('fs').writeFileSync(
        'deployments/ethereum-verifier.json',
        JSON.stringify(deployment, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### 3. Target Chain 배포

```javascript
// scripts/deploy-target.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying FlagReceiver with:", deployer.address);
    
    const ccipRouter = process.env.POLYGON_CCIP_ROUTER;
    
    const FlagReceiver = await ethers.getContractFactory("FlagReceiver");
    const receiver = await FlagReceiver.deploy(ccipRouter);
    await receiver.deployed();
    
    console.log("FlagReceiver deployed to:", receiver.address);
    
    // 배포 정보 저장
    const deployment = {
        network: "polygon-mumbai",
        receiver: receiver.address,
        ccipRouter: ccipRouter,
        timestamp: new Date().toISOString()
    };
    
    require('fs').writeFileSync(
        'deployments/polygon-receiver.json',
        JSON.stringify(deployment, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### 4. 화이트리스트 설정

```javascript
// scripts/setup-whitelist.js
const { ethers } = require("hardhat");

async function main() {
    // 배포된 컨트랙트 정보 로드
    const ethereumDeployment = require('../deployments/ethereum-verifier.json');
    const polygonDeployment = require('../deployments/polygon-receiver.json');
    
    // Polygon 네트워크에 연결
    const FlagReceiver = await ethers.getContractFactory("FlagReceiver");
    const receiver = FlagReceiver.attach(polygonDeployment.receiver);
    
    // Ethereum Verifier를 신뢰할 수 있는 송신자로 등록
    const ethereumSelector = process.env.ETHEREUM_SEPOLIA_SELECTOR;
    const verifierAddress = ethereumDeployment.verifier;
    
    console.log("Setting trusted verifier...");
    console.log("Source Chain Selector:", ethereumSelector);
    console.log("Verifier Address:", verifierAddress);
    
    const tx = await receiver.setTrustedVerifier(
        ethereumSelector,
        verifierAddress,
        true
    );
    
    await tx.wait();
    console.log("Trusted verifier set successfully!");
    
    // 검증
    const isTrusted = await receiver.trustedVerifiers(ethereumSelector, verifierAddress);
    console.log("Verification:", isTrusted ? "✅ Trusted" : "❌ Not trusted");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### 5. 전체 배포 스크립트

```bash
#!/bin/bash
# deploy-all.sh

echo "🚀 Starting deployment..."

# 1. Source chain 배포
echo "📝 Deploying to Ethereum Sepolia..."
npx hardhat run scripts/deploy-source.js --network ethereum-sepolia

# 2. Target chain 배포
echo "📝 Deploying to Polygon Mumbai..."
npx hardhat run scripts/deploy-target.js --network polygon-mumbai

# 3. 화이트리스트 설정
echo "🔐 Setting up whitelist..."
npx hardhat run scripts/setup-whitelist.js --network polygon-mumbai

echo "✅ Deployment complete!"
echo "📄 Check deployments/ folder for addresses"
```

---

## 보안 고려사항

### 1. 타임스탬프 검증

```solidity
// ❌ 잘못된 방법: 타임스탬프 체크 없음
function grantFlag(bytes32 attestationId) external {
    // 공격자가 오래된 Attestation 재사용 가능
}

// ✅ 올바른 방법: 신선도 검증
function grantFlag(bytes32 attestationId) external {
    ReceivedAttestation memory att = receivedAttestations[attestationId];
    
    require(
        block.timestamp - att.timestamp <= MAX_ATTESTATION_AGE,
        "Attestation expired"
    );
}
```

### 2. 중복 사용 방지

```solidity
// Attestation 사용 여부 추적
struct ReceivedAttestation {
    // ... 기타 필드
    bool used;  // 플래그 발급 여부
}

function grantFlag(bytes32 attestationId, bytes32 flagType) external {
    require(!attestation.used, "Already used");
    
    // 플래그 부여 후 사용 표시
    attestation.used = true;
}
```

### 3. Nonce 기반 고유성

```solidity
// Source chain에서 고유한 attestationId 보장
mapping(address => uint256) public nonces;

function createAttestation(...) external returns (bytes32) {
    attestationId = keccak256(abi.encodePacked(
        block.chainid,
        nftContract,
        tokenId,
        msg.sender,
        nonces[msg.sender]++,  // 매번 증가
        block.timestamp
    ));
}
```

### 4. 재검증 메커니즘

```solidity
// Bridge 전에 소유권 재확인
function bridgeAttestation(bytes32 attestationId, ...) external {
    Attestation memory att = attestations[attestationId];
    
    // 여전히 소유자인지 재검증
    address currentOwner = IERC721(att.nftContract).ownerOf(att.tokenId);
    require(currentOwner == msg.sender, "No longer owner");
    
    // CCIP 전송...
}
```

### 5. 화이트리스트 관리

```solidity
// ❌ 위험: 누구나 Verifier 등록 가능
function setTrustedVerifier(...) external {
    trustedVerifiers[chain][verifier] = true;
}

// ✅ 안전: Owner만 등록 가능 + 이벤트 발생
function setTrustedVerifier(...) external onlyOwner {
    require(verifier != address(0), "Invalid address");
    trustedVerifiers[chain][verifier] = trusted;
    emit TrustedVerifierSet(chain, verifier, trusted);
}
```

### 6. Rate Limiting (선택사항)

```solidity
// 사용자당 일일 Attestation 생성 제한
mapping(address => mapping(uint256 => uint256)) public dailyAttestations;
uint256 public constant MAX_DAILY_ATTESTATIONS = 10;

function createAttestation(...) external returns (bytes32) {
    uint256 today = block.timestamp / 1 days;
    require(
        dailyAttestations[msg.sender][today] < MAX_DAILY_ATTESTATIONS,
        "Daily limit exceeded"
    );
    
    dailyAttestations[msg.sender][today]++;
    
    // ... Attestation 생성
}
```

---

## 테스트 시나리오

### 단위 테스트

```javascript
// test/NFTVerifier.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTOwnershipVerifier", function () {
    let verifier, mockNFT, owner, user;
    
    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        // Mock NFT 배포
        const MockNFT = await ethers.getContractFactory("MockERC721");
        mockNFT = await MockNFT.deploy("TestNFT", "TNFT");
        
        // Verifier 배포
        const Verifier = await ethers.getContractFactory("NFTOwnershipVerifier");
        verifier = await Verifier.deploy(ethers.constants.AddressZero); // Mock router
        
        // NFT 지원 추가
        await verifier.addSupportedNFT(mockNFT.address);
        
        // User에게 NFT 발행
        await mockNFT.mint(user.address, 1);
    });
    
    it("Should create attestation for NFT owner", async function () {
        const tx = await verifier.connect(user).createAttestation(mockNFT.address, 1);
        const receipt = await tx.wait();
        
        const event = receipt.events.find(e => e.event === "AttestationCreated");
        expect(event).to.not.be.undefined;
        
        const attestationId = event.args.attestationId;
        const attestation = await verifier.attestations(attestationId);
        
        expect(attestation.owner).to.equal(user.address);
        expect(attestation.nftContract).to.equal(mockNFT.address);
        expect(attestation.tokenId).to.equal(1);
    });
    
    it("Should reject non-owner", async function () {
        await expect(
            verifier.connect(owner).createAttestation(mockNFT.address, 1)
        ).to.be.revertedWith("Not the owner");
    });
    
    it("Should validate attestation freshness", async function () {
        const tx = await verifier.connect(user).createAttestation(mockNFT.address, 1);
        const receipt = await tx.wait();
        const attestationId = receipt.events[0].args.attestationId;
        
        // NFT를 다른 사람에게 전송
        await mockNFT.connect(user).transferFrom(user.address, owner.address, 1);
        
        // Attestation은 더 이상 유효하지 않음
        const isValid = await verifier.isAttestationStillValid(attestationId);
        expect(isValid).to.be.false;
    });
});
```

### 통합 테스트

```javascript
// test/integration.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Cross-Chain Integration", function () {
    let verifier, receiver, mockNFT, ccipRouter, user;
    
    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();
        
        // Mock CCIP Router
        const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
        ccipRouter = await MockRouter.deploy();
        
        // Mock NFT
        const MockNFT = await ethers.getContractFactory("MockERC721");
        mockNFT = await MockNFT.deploy("TestNFT", "TNFT");
        await mockNFT.mint(user.address, 1);
        
        // Source chain Verifier
        const Verifier = await ethers.getContractFactory("NFTOwnershipVerifier");
        verifier = await Verifier.deploy(ccipRouter.address);
        await verifier.addSupportedNFT(mockNFT.address);
        
        // Target chain Receiver
        const Receiver = await ethers.getContractFactory("FlagReceiver");
        receiver = await Receiver.deploy(ccipRouter.address);
        
        // 화이트리스트 설정
        await receiver.setTrustedVerifier(1, verifier.address, true);
    });
    
    it("Should complete full flow: create -> bridge -> grant flag", async function () {
        // 1. Attestation 생성
        const createTx = await verifier.connect(user).createAttestation(
            mockNFT.address,
            1
        );
        const createReceipt = await createTx.wait();
        const attestationId = createReceipt.events[0].args.attestationId;
        
        // 2. CCIP로 전송 (Mock)
        const attestation = await verifier.attestations(attestationId);
        const message = {
            sender: ethers.utils.defaultAbiCoder.encode(["address"], [verifier.address]),
            data: ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "tuple(address,uint256,address,uint256,uint256,uint64,bytes32)"],
                [attestationId, Object.values(attestation)]
            ),
            sourceChainSelector: 1
        };
        
        // 3. Receiver에서 수신
        await receiver.ccipReceive(message);
        
        // 4. 플래그 부여
        const flagType = ethers.utils.formatBytes32String("PREMIUM");
        await receiver.connect(user).grantFlag(attestationId, flagType);
        
        // 5. 검증
        const hasFlag = await receiver.hasFlag(user.address, flagType);
        expect(hasFlag).to.be.true;
    });
    
    it("Should reject untrusted verifier", async function () {
        // 신뢰하지 않는 주소에서 메시지 전송
        const fakeMessage = {
            sender: ethers.utils.defaultAbiCoder.encode(["address"], [owner.address]),
            data: "0x",
            sourceChainSelector: 1
        };
        
        await expect(
            receiver.ccipReceive(fakeMessage)
        ).to.be.revertedWith("Untrusted verifier");
    });
});
```

### E2E 테스트 체크리스트

```markdown
## E2E 테스트 시나리오

### Happy Path
- [ ] NFT 소유자가 Attestation 생성
- [ ] CCIP를 통해 타겟 체인으로 전송
- [ ] 타겟 체인에서 Attestation 수신
- [ ] 사용자가 플래그 획득
- [ ] 플래그를 사용한 기능 접근

### Edge Cases
- [ ] 비소유자가 Attestation 생성 시도 → 실패
- [ ] NFT 전송 후 Attestation 브릿징 → 실패
- [ ] 오래된 Attestation으로 플래그 획득 시도 → 실패
- [ ] 이미 사용된 Attestation 재사용 → 실패
- [ ] 신뢰하지 않는 Verifier에서 메시지 수신 → 차단
- [ ] 플래그 만료 후 접근 시도 → 실패

### Security Tests
- [ ] CCIP 메시지 위조 시도
- [ ] 리플레이 공격
- [ ] 타임스탬프 조작
- [ ] Rate limiting 테스트
- [ ] 권한 관리 (onlyOwner)
```

---

## 사용 예시

### 프론트엔드 통합

```javascript
// frontend/utils/nftVerification.js
import { ethers } from 'ethers';

export async function createAndBridgeAttestation(
    nftAddress,
    tokenId,
    destinationChain
) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // 1. Verifier 컨트랙트 연결
    const verifier = new ethers.Contract(
        VERIFIER_ADDRESS,
        VERIFIER_ABI,
        signer
    );
    
    // 2. Attestation 생성
    console.log("Creating attestation...");
    const createTx = await verifier.createAttestation(nftAddress, tokenId);
    const createReceipt = await createTx.wait();
    
    const event = createReceipt.events.find(e => e.event === 'AttestationCreated');
    const attestationId = event.args.attestationId;
    
    console.log("Attestation created:", attestationId);
    
    // 3. 수수료 계산
    const fee = await verifier.estimateFee(
        attestationId,
        destinationChain.selector,
        destinationChain.receiver
    );
    
    console.log("CCIP fee:", ethers.utils.formatEther(fee), "ETH");
    
    // 4. CCIP로 브릿징
    const bridgeTx = await verifier.bridgeAttestation(
        attestationId,
        destinationChain.selector,
        destinationChain.receiver,
        { value: fee }
    );
    
    const bridgeReceipt = await bridgeTx.wait();
    const messageId = bridgeReceipt.events.find(
        e => e.event === 'AttestationBridged'
    ).args.messageId;
    
    console.log("Message sent via CCIP:", messageId);
    
    return {
        attestationId,
        messageId,
        fee: ethers.utils.formatEther(fee)
    };
}

export async function claimFlag(attestationId, flagType) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    const receiver = new ethers.Contract(
        RECEIVER_ADDRESS,
        RECEIVER_ABI,
        signer
    );
    
    console.log("Granting flag...");
    const tx = await receiver.grantFlag(attestationId, flagType);
    await tx.wait();
    
    console.log("Flag granted successfully!");
}

export async function checkFlag(userAddress, flagType) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    const receiver = new ethers.Contract(
        RECEIVER_ADDRESS,
        RECEIVER_ABI,
        provider
    );
    
    return await receiver.hasFlag(userAddress, flagType);
}
```

### React 컴포넌트 예시

```jsx
// components/NFTVerificationFlow.jsx
import { useState } from 'react';
import { createAndBridgeAttestation, claimFlag, checkFlag } from '../utils/nftVerification';

export function NFTVerificationFlow() {
    const [status, setStatus] = useState('idle');
    const [attestationId, setAttestationId] = useState(null);
    
    const handleVerify = async () => {
        try {
            setStatus('creating');
            
            const result = await createAndBridgeAttestation(
                '0x...', // NFT address
                1,       // Token ID
                {
                    selector: '12532609583862916517',
                    receiver: '0x...'
                }
            );
            
            setAttestationId(result.attestationId);
            setStatus('bridging');
            
            // CCIP 전송 완료 대기 (실제로는 이벤트 리스닝 필요)
            await new Promise(resolve => setTimeout(resolve, 60000));
            
            setStatus('ready');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };
    
    const handleClaimFlag = async () => {
        try {
            setStatus('claiming');
            
            await claimFlag(
                attestationId,
                ethers.utils.formatBytes32String('PREMIUM_ACCESS')
            );
            
            setStatus('complete');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };
    
    return (
        <div>
            {status === 'idle' && (
                <button onClick={handleVerify}>
                    Verify NFT Ownership
                </button>
            )}
            
            {status === 'creating' && <p>Creating attestation...</p>}
            {status === 'bridging' && <p>Bridging to target chain...</p>}
            
            {status === 'ready' && (
                <button onClick={handleClaimFlag}>
                    Claim Premium Access
                </button>
            )}
            
            {status === 'claiming' && <p>Granting flag...</p>}
            {status === 'complete' && <p>✅ Premium access granted!</p>}
            {status === 'error' && <p>❌ Error occurred</p>}
        </div>
    );
}
```

---

## 가스 최적화

### 1. Packed Storage

```solidity
// ❌ 비효율적: 각 필드가 별도 슬롯 차지
struct Attestation {
    address nftContract;      // 슬롯 0
    uint256 tokenId;          // 슬롯 1
    address owner;            // 슬롯 2
    uint256 timestamp;        // 슬롯 3
    uint256 blockNumber;      // 슬롯 4
}

// ✅ 최적화: 필드 순서 조정으로 슬롯 절약
struct Attestation {
    address nftContract;      // 슬롯 0 (20 bytes)
    uint64 timestamp;         // 슬롯 0 (8 bytes) - 같은 슬롯
    uint32 blockNumber;       // 슬롯 0 (4 bytes) - 같은 슬롯
    address owner;            // 슬롯 1 (20 bytes)
    uint256 tokenId;          // 슬롯 2
}
```

### 2. Calldata vs Memory

```solidity
// ❌ 비효율적
function bridgeAttestation(
    bytes32 attestationId,
    string memory destinationAddress  // memory: 비쌈
) external {}

// ✅ 최적화
function bridgeAttestation(
    bytes32 attestationId,
    string calldata destinationAddress  // calldata: 저렴
) external {}
```

---

## 참고 자료

### Chainlink CCIP
- [공식 문서](https://docs.chain.link/ccip)
- [Chain Selectors](https://docs.chain.link/ccip/supported-networks)
- [CCIP Explorer](https://ccip.chain.link/)

### 표준 및 프로토콜
- [ERC-721 NFT Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Ethereum Attestation Service](https://attest.sh/)
- [Sign Protocol](https://sign.global/)

### 보안
- [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [CCIP Security](https://docs.chain.link/ccip/concepts/security)

---

이 문서는 외부 체인 NFT 소유권 검증 시스템의 완전한 구현 가이드입니다. 각 섹션의 코드는 production-ready 수준으로 작성되었으며, 보안 고려사항과 테스트 시나리오가 포함되어 있습니다.

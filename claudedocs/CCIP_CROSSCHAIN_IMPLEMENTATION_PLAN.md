# Ethereum Sepolia NFT 소유권 검증 → Chainlink CCIP → Monad Testnet 특수 Trait 민팅 시스템 구현 계획

**작성일**: 2025-01-15
**프로젝트**: Minecraft PFP NFT with Cross-Chain Verification
**목적**: Sepolia NFT 소유자에게 Monad 민팅 시 특수 시각적 trait 부여

---

## 📋 구현 목표

Sepolia 테스트넷에서 특정 NFT 컬렉션 소유자가 Chainlink CCIP를 통해 소유권 attestation을 Monad Testnet으로 전송하고, Monad에서 민팅 시 특수 시각적 trait(골든 크라운)이 추가된 Minecraft PFP NFT를 발행하는 크로스체인 시스템 구축

---

## 🏗️ 시스템 아키텍처

```
[Sepolia Testnet]
├─ NFTOwnershipVerifier 컨트랙트 (새로 배포)
│  └─ ERC721 소유권 검증
│  └─ CCIP 메시지 생성 및 전송
│
└─ 프론트엔드: Sepolia 지갑 연결 UI
   └─ NFT 소유 확인
   └─ Attestation 생성 버튼
   └─ CCIP 전송 트랜잭션

        ↓ CCIP Network (15-30분 소요)

[Monad Testnet]
├─ MonadCCIPReceiver 컨트랙트 (새로 배포)
│  └─ CCIP 메시지 수신
│  └─ Attestation 검증 및 저장
│
├─ MinecraftPFPWithWealth 컨트랙트 (업데이트)
│  └─ mint() 시 attestation 체크
│  └─ hasCCIPBonus 플래그 설정
│
└─ 프론트엔드: 민팅 플로우
   └─ Attestation 상태 확인
   └─ 특수 시각 요소 렌더링 (골든 크라운)
   └─ 민팅 완료
```

---

## 🔍 현재 프로젝트 구조 분석

### 1. 스마트 컨트랙트 현황
- **MinecraftPFPWithWealth.sol**: ERC721 기반, Chainlink Price Feed 통합, wealth tier 시스템
- **TraitGenerator.sol**: 결정론적 trait 생성 라이브러리
- **현재 제한**: 단일 체인 내 민팅만 지원, 크로스체인 검증 없음

### 2. 민팅 파이프라인
```typescript
executeMintPipeline():
1. generateTraits(address) → SkinTraits
2. createSkinTexture(traits) → 64x64 Canvas
3. createMinecraftScene() → Three.js Scene
4. captureAnimationFrames() → 60 프레임
5. generateGIF(frames) → GIF Blob
6. uploadGIFToIPFS(blob) → GIF CID
7. generateMetadata() → NFT Metadata
8. uploadMetadataToIPFS() → Metadata CID
9. disposeScene() → 메모리 정리
→ mint(metadataUri) 호출
```

### 3. AI 스킨 생성 시스템
- **모델**: Claude Haiku 4.5
- **UV 매핑**: Minecraft 64x64 공식 사양 준수
- **디더링**: 체커보드 패턴으로 3D 깊이감 구현
- **확장 가능**: 오버레이 레이어에 특수 요소 추가 가능

### 4. Monad Testnet CCIP 지원 확인 ✅
- **Router Address**: `0x5f16...3E54`
- **Chain Selector**: `2183018362218727504`
- **Sepolia ↔ Monad 간 CCIP 완전 지원**

---

## 📦 Phase 1: 스마트 컨트랙트 개발

### 1.1 Sepolia - NFTOwnershipVerifier.sol
**위치**: `contracts/sepolia/NFTOwnershipVerifier.sol` (신규)

**핵심 기능**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract NFTOwnershipVerifier is Ownable {
    IRouterClient public immutable ccipRouter;

    struct Attestation {
        address nftContract;
        uint256 tokenId;
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        uint64 sourceChainSelector;
        bytes32 attestationId;
    }

    mapping(bytes32 => Attestation) public attestations;
    mapping(address => uint256) public nonces;
    mapping(address => bool) public supportedNFTs;

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

    function addSupportedNFT(address nftContract) external onlyOwner;

    function createAttestation(
        address nftContract,
        uint256 tokenId
    ) external returns (bytes32 attestationId);

    function bridgeAttestation(
        bytes32 attestationId,
        uint64 destinationChainSelector,
        address receiver
    ) external payable returns (bytes32 messageId);

    function estimateFee(
        bytes32 attestationId,
        uint64 destinationChainSelector,
        address receiver
    ) external view returns (uint256 fee);
}
```

**주요 로직**:
1. **createAttestation()**:
   - ERC721.ownerOf() 호출하여 실제 소유권 검증
   - 고유 attestationId 생성 (nonce 기반)
   - Attestation 온체인 저장

2. **bridgeAttestation()**:
   - NFT 소유권 재검증 (전송 후 검증 방지)
   - CCIP 메시지 구성 및 전송
   - 수수료 계산 및 잔액 환불

### 1.2 Monad - MonadCCIPReceiver.sol
**위치**: `contracts/monad/MonadCCIPReceiver.sol` (신규)

**핵심 기능**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MonadCCIPReceiver is CCIPReceiver, Ownable {

    struct ReceivedAttestation {
        address nftContract;
        uint256 tokenId;
        address owner;
        uint256 timestamp;
        uint256 blockNumber;
        uint64 sourceChainSelector;
        bytes32 attestationId;
        uint256 receivedAt;
        bool used;
    }

    mapping(bytes32 => ReceivedAttestation) public receivedAttestations;
    mapping(uint64 => mapping(address => bool)) public trustedVerifiers;

    uint256 public constant MAX_ATTESTATION_AGE = 7 days;

    event AttestationReceived(
        bytes32 indexed attestationId,
        address indexed owner,
        uint64 sourceChain
    );

    event AttestationUsed(
        bytes32 indexed attestationId,
        address indexed user
    );

    constructor(address _ccipRouter) CCIPReceiver(_ccipRouter) {}

    function setTrustedVerifier(
        uint64 sourceChainSelector,
        address verifier,
        bool trusted
    ) external onlyOwner;

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override;

    function hasValidAttestation(address user) external view returns (bool);

    function markAttestationUsed(address user) external;
}
```

**주요 로직**:
1. **_ccipReceive()**:
   - 송신자 화이트리스트 검증
   - Attestation 디코딩 및 저장
   - 중복 방지

2. **hasValidAttestation()**:
   - 사용자의 유효한 attestation 존재 여부
   - 만료 여부 체크 (7일)
   - 사용 여부 체크

### 1.3 MinecraftPFPWithWealth.sol 업데이트
**위치**: `contracts/monad/MinecraftPFPWithWealth.sol` (수정)

**변경사항**:
```solidity
// 새 상태 변수 추가
MonadCCIPReceiver public ccipReceiver;
mapping(uint256 => bool) public hasCCIPBonus;

// 생성자 또는 setter 함수
function setCCIPReceiver(address _ccipReceiver) external onlyOwner {
    ccipReceiver = MonadCCIPReceiver(_ccipReceiver);
}

// mint() 함수 수정
function mint(string memory ipfsUri) public returns (uint256) {
    require(ownerToToken[msg.sender] == 0, "Already minted");

    // 기존 wealth 계산...
    uint256 totalWealthUSD = calculateTotalWealth(msg.sender);
    uint8 wealthTier = getWealthTier(totalWealthUSD);
    uint8 specialItem = getSpecialItemFromWealth(wealthTier);

    // NFT 발행
    _tokenIdCounter.increment();
    uint256 tokenId = _tokenIdCounter.current();
    _safeMint(msg.sender, tokenId);
    _setTokenURI(tokenId, ipfsUri);

    // CCIP Attestation 체크 ⭐ 새로 추가
    bool hasAttestation = address(ccipReceiver) != address(0)
        && ccipReceiver.hasValidAttestation(msg.sender);

    if (hasAttestation) {
        hasCCIPBonus[tokenId] = true;
        ccipReceiver.markAttestationUsed(msg.sender);
        emit CCIPBonusGranted(tokenId, msg.sender);
    }

    // 기존 스냅샷 저장...
    ownerToToken[msg.sender] = tokenId;
    tokenToSnapshot[tokenId] = MintSnapshot({
        totalWealthUSD: totalWealthUSD,
        wealthTier: wealthTier,
        ethBalance: ethBalance,
        usdtBalance: usdtBalance,
        usdcBalance: usdcBalance,
        timestamp: block.timestamp
    });

    emit NFTMinted(msg.sender, tokenId, totalWealthUSD, wealthTier, specialItem);

    return tokenId;
}

// 새 조회 함수
function getTokenCCIPStatus(uint256 tokenId) external view returns (bool) {
    return hasCCIPBonus[tokenId];
}

// 새 이벤트
event CCIPBonusGranted(uint256 indexed tokenId, address indexed owner);
```

### 1.4 배포 스크립트
**위치**: `scripts/deploy-ccip.ts` (신규)

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("🚀 CCIP Deployment Starting...\n");

  // 환경 변수
  const SEPOLIA_CCIP_ROUTER = process.env.SEPOLIA_CCIP_ROUTER!;
  const MONAD_CCIP_ROUTER = process.env.MONAD_CCIP_ROUTER!;
  const SEPOLIA_NFT_CONTRACT = process.env.SEPOLIA_NFT_CONTRACT!;
  const SEPOLIA_CHAIN_SELECTOR = process.env.SEPOLIA_CHAIN_SELECTOR!;
  const MINECRAFT_PFP_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

  // 1. Sepolia에 NFTOwnershipVerifier 배포
  console.log("📝 Deploying NFTOwnershipVerifier to Sepolia...");
  const Verifier = await ethers.getContractFactory("NFTOwnershipVerifier");
  const verifier = await Verifier.deploy(SEPOLIA_CCIP_ROUTER);
  await verifier.deployed();
  console.log(`✅ NFTOwnershipVerifier deployed: ${verifier.address}\n`);

  // 2. Sepolia NFT 컬렉션 등록
  console.log("📝 Adding supported NFT...");
  await verifier.addSupportedNFT(SEPOLIA_NFT_CONTRACT);
  console.log(`✅ NFT ${SEPOLIA_NFT_CONTRACT} added\n`);

  // 3. Monad에 MonadCCIPReceiver 배포
  console.log("📝 Deploying MonadCCIPReceiver to Monad...");
  const Receiver = await ethers.getContractFactory("MonadCCIPReceiver");
  const receiver = await Receiver.deploy(MONAD_CCIP_ROUTER);
  await receiver.deployed();
  console.log(`✅ MonadCCIPReceiver deployed: ${receiver.address}\n`);

  // 4. 화이트리스트 설정
  console.log("🔐 Setting up whitelist...");
  await receiver.setTrustedVerifier(
    SEPOLIA_CHAIN_SELECTOR,
    verifier.address,
    true
  );
  console.log(`✅ Trusted verifier set\n`);

  // 5. MinecraftPFPWithWealth에 CCIPReceiver 연결
  console.log("🔗 Connecting CCIPReceiver to MinecraftPFP...");
  const MinecraftPFP = await ethers.getContractAt(
    "MinecraftPFPWithWealth",
    MINECRAFT_PFP_ADDRESS
  );
  await MinecraftPFP.setCCIPReceiver(receiver.address);
  console.log(`✅ CCIPReceiver connected\n`);

  // 배포 정보 저장
  const deployment = {
    sepolia: {
      verifier: verifier.address,
      ccipRouter: SEPOLIA_CCIP_ROUTER,
      supportedNFT: SEPOLIA_NFT_CONTRACT
    },
    monad: {
      receiver: receiver.address,
      ccipRouter: MONAD_CCIP_ROUTER,
      minecraftPFP: MINECRAFT_PFP_ADDRESS
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployments/ccip-deployment.json',
    JSON.stringify(deployment, null, 2)
  );

  console.log("📄 Deployment info saved to deployments/ccip-deployment.json");
  console.log("\n✨ CCIP Deployment Complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## 🗄️ Phase 2: 데이터베이스 스키마 업데이트

### 2.1 새 테이블: ccip_attestations
**위치**: `src/lib/db/migrations/002_ccip_attestations.sql` (신규)

```sql
-- CCIP Attestation 추적 테이블
CREATE TABLE ccip_attestations (
    id SERIAL PRIMARY KEY,
    monad_address VARCHAR(42) NOT NULL,
    sepolia_nft_address VARCHAR(42) NOT NULL,
    sepolia_token_id BIGINT NOT NULL,
    ccip_message_id VARCHAR(66) NOT NULL UNIQUE,
    attestation_id VARCHAR(66) NOT NULL UNIQUE,
    source_chain_selector VARCHAR(20) NOT NULL,
    sepolia_tx_hash VARCHAR(66) NOT NULL,
    monad_received_at TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('pending', 'received', 'used', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- 인덱스
    INDEX idx_monad_address (monad_address),
    INDEX idx_status (status),
    INDEX idx_ccip_message_id (ccip_message_id),
    INDEX idx_attestation_id (attestation_id)
);

-- 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_ccip_attestations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ccip_attestations_updated_at
    BEFORE UPDATE ON ccip_attestations
    FOR EACH ROW
    EXECUTE FUNCTION update_ccip_attestations_updated_at();
```

### 2.2 skins 테이블 확장
```sql
-- skins 테이블에 CCIP 관련 필드 추가
ALTER TABLE skins
ADD COLUMN has_ccip_attestation BOOLEAN DEFAULT false,
ADD COLUMN ccip_attestation_id INTEGER REFERENCES ccip_attestations(id);

-- 인덱스 추가
CREATE INDEX idx_skins_has_ccip ON skins(has_ccip_attestation);
```

---

## 🖥️ Phase 3: 프론트엔드 - Sepolia 연동 UI

### 3.1 Sepolia 체인 지원 추가
**위치**: `src/lib/chains.ts` (신규)

```typescript
import { Chain } from 'wagmi/chains';

export const sepolia: Chain = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org']
    },
    public: {
      http: ['https://rpc.sepolia.org']
    }
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io'
    }
  },
  testnet: true
};

export const monadTestnet: Chain = {
  // 기존 Monad 설정...
};
```

### 3.2 Wagmi 설정 업데이트
**위치**: `src/lib/wagmi.ts` (수정)

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from './chains';
import { monadTestnet } from './chains';

const config = getDefaultConfig({
  appName: 'Minecraft PFP NFT',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [monadTestnet, sepolia], // ⭐ Sepolia 추가
  ssr: true,
});

export default config;
```

### 3.3 Sepolia NFT 확인 컴포넌트
**위치**: `src/components/SepoliaNFTVerification.tsx` (신규)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useNetwork, useSwitchNetwork, useContractRead, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';

interface NFTInfo {
  tokenId: bigint;
  contractAddress: string;
}

export function SepoliaNFTVerification() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const [nfts, setNfts] = useState<NFTInfo[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFTInfo | null>(null);
  const [attestationId, setAttestationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('idle');

  const SEPOLIA_CHAIN_ID = 11155111;
  const SEPOLIA_NFT_CONTRACT = process.env.NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT!;
  const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS!;

  // NFT 소유권 확인
  useEffect(() => {
    if (address && chain?.id === SEPOLIA_CHAIN_ID) {
      checkNFTOwnership();
    }
  }, [address, chain]);

  async function checkNFTOwnership() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ccip/check-sepolia-nft?address=${address}`
      );
      const data = await response.json();

      if (data.hasNFT) {
        setNfts(data.tokenIds.map((id: number) => ({
          tokenId: BigInt(id),
          contractAddress: SEPOLIA_NFT_CONTRACT
        })));
        setStatus('nft-found');
      } else {
        setStatus('no-nft');
      }
    } catch (error) {
      console.error('NFT check failed:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  // Attestation 생성
  const { write: createAttestation } = useContractWrite({
    address: VERIFIER_ADDRESS as `0x${string}`,
    abi: [
      {
        name: 'createAttestation',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' }
        ],
        outputs: [{ name: 'attestationId', type: 'bytes32' }]
      }
    ],
    functionName: 'createAttestation',
    args: selectedNFT ? [
      SEPOLIA_NFT_CONTRACT as `0x${string}`,
      selectedNFT.tokenId
    ] : undefined,
    onSuccess: (data) => {
      console.log('Attestation created:', data);
      setAttestationId(data.hash);
      setStatus('attestation-created');
    }
  });

  // CCIP 브릿징
  const { write: bridgeAttestation } = useContractWrite({
    address: VERIFIER_ADDRESS as `0x${string}`,
    abi: [
      {
        name: 'bridgeAttestation',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
          { name: 'attestationId', type: 'bytes32' },
          { name: 'destinationChainSelector', type: 'uint64' },
          { name: 'receiver', type: 'address' }
        ],
        outputs: [{ name: 'messageId', type: 'bytes32' }]
      }
    ],
    functionName: 'bridgeAttestation',
    // args, value는 실행 시 동적으로 설정
    onSuccess: (data) => {
      console.log('CCIP message sent:', data);
      setStatus('ccip-sent');

      // DB에 기록
      fetch('/api/ccip/record-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monadAddress: address,
          sepoliaNFTAddress: SEPOLIA_NFT_CONTRACT,
          sepoliaTokenId: selectedNFT?.tokenId.toString(),
          ccipMessageId: data.hash,
          attestationId,
          sepoliaTxHash: data.hash
        })
      });
    }
  });

  return (
    <div className="border-2 border-gray-300 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">🌉 Sepolia NFT Verification</h3>

      {/* Sepolia 연결 */}
      {chain?.id !== SEPOLIA_CHAIN_ID ? (
        <button
          onClick={() => switchNetwork?.(SEPOLIA_CHAIN_ID)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Switch to Sepolia Network
        </button>
      ) : (
        <>
          {/* NFT 목록 */}
          {loading && <p>Checking NFT ownership...</p>}

          {status === 'no-nft' && (
            <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
              ❌ You don't own any NFTs from the eligible collection.
            </div>
          )}

          {status === 'nft-found' && nfts.length > 0 && (
            <div className="mb-4">
              <p className="mb-2">✅ You own {nfts.length} eligible NFT(s):</p>
              <div className="space-y-2">
                {nfts.map((nft) => (
                  <div
                    key={nft.tokenId.toString()}
                    className={`border-2 p-3 rounded cursor-pointer ${
                      selectedNFT?.tokenId === nft.tokenId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    onClick={() => setSelectedNFT(nft)}
                  >
                    Token ID: {nft.tokenId.toString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attestation 생성 */}
          {selectedNFT && !attestationId && (
            <button
              onClick={() => createAttestation?.()}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Create Attestation
            </button>
          )}

          {/* CCIP 전송 */}
          {attestationId && status === 'attestation-created' && (
            <div className="mt-4">
              <p className="mb-2">✅ Attestation created!</p>
              <button
                onClick={() => {
                  // 수수료 견적 후 bridgeAttestation 호출
                  // 실제 구현 시 estimateFee 먼저 호출 필요
                  bridgeAttestation?.();
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
              >
                Send to Monad via CCIP
              </button>
            </div>
          )}

          {/* CCIP 전송 완료 */}
          {status === 'ccip-sent' && (
            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 mt-4">
              <p className="font-bold">🎉 CCIP Message Sent!</p>
              <p className="text-sm">
                Your attestation is being bridged to Monad.
                This may take 15-30 minutes.
              </p>
              <p className="text-sm mt-2">
                Switch to Monad network to mint your special NFT!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 3.4 CCIP 상태 모니터링 컴포넌트
**위치**: `src/components/CCIPStatusMonitor.tsx` (신규)

```typescript
'use client';

import { useState, useEffect } from 'react';

interface CCIPStatusMonitorProps {
  messageId: string;
  monadAddress: string;
}

export function CCIPStatusMonitor({ messageId, monadAddress }: CCIPStatusMonitorProps) {
  const [status, setStatus] = useState<{
    status: string;
    progress: number;
    estimatedTime: string;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/ccip/monitor/${messageId}`);
      const data = await response.json();
      setStatus(data);

      if (data.status === 'finalized') {
        clearInterval(interval);
      }
    }, 10000); // 10초마다 체크

    return () => clearInterval(interval);
  }, [messageId]);

  if (!status) return <p>Loading status...</p>;

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 mt-4">
      <h4 className="font-bold mb-2">CCIP Transfer Status</h4>

      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
          style={{ width: `${status.progress}%` }}
        />
      </div>

      <p className="text-sm">
        Status: <span className="font-semibold">{status.status}</span>
      </p>
      <p className="text-sm">
        Estimated time: {status.estimatedTime}
      </p>

      {status.status === 'finalized' && (
        <div className="bg-green-100 border-2 border-green-400 rounded p-2 mt-2">
          ✅ Attestation received on Monad! You can now mint with special traits.
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 Phase 4: 프론트엔드 - 시각적 요소 렌더링

### 4.1 AI 스킨 생성에 CCIP 플래그 추가
**위치**: `src/lib/aiSkinGenerator.ts` (수정)

```typescript
export async function generateAISkin(
  traits: SkinTraits,
  apiKey: string,
  hasCCIPAttestation: boolean = false // ⭐ 새 파라미터
): Promise<string> {
  // 기존 색상 스킴 생성...
  const colorScheme = await generateColorScheme(traits, apiKey);

  // 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // 기존 스킨 렌더링...
  renderSkinFromColorScheme(ctx, colorScheme, traits);

  // ⭐ CCIP 특수 요소 렌더링
  if (hasCCIPAttestation) {
    console.log('🌟 Rendering CCIP special visual: Golden Crown');
    renderGoldenCrown(ctx);
  }

  return canvas.toDataURL();
}

/**
 * 골든 크라운 렌더링 (Head Overlay)
 * UV 좌표: (40, 8) ~ (48, 16)
 */
function renderGoldenCrown(ctx: CanvasRenderingContext2D) {
  const GOLD = '#FFD700';
  const DARK_GOLD = '#DAA520';
  const LIGHT_GOLD = '#FFEC8B';

  // 크라운 베이스 (간단한 픽셀 아트)
  const crownPixels = [
    // 하단 (y=15)
    { x: 41, y: 15, color: DARK_GOLD },
    { x: 42, y: 15, color: GOLD },
    { x: 43, y: 15, color: GOLD },
    { x: 44, y: 15, color: GOLD },
    { x: 45, y: 15, color: GOLD },
    { x: 46, y: 15, color: DARK_GOLD },

    // 중간 (y=14)
    { x: 41, y: 14, color: GOLD },
    { x: 42, y: 14, color: LIGHT_GOLD },
    { x: 43, y: 14, color: GOLD },
    { x: 44, y: 14, color: GOLD },
    { x: 45, y: 14, color: LIGHT_GOLD },
    { x: 46, y: 14, color: GOLD },

    // 윗부분 (y=13)
    { x: 42, y: 13, color: GOLD },
    { x: 43, y: 13, color: LIGHT_GOLD },
    { x: 44, y: 13, color: LIGHT_GOLD },
    { x: 45, y: 13, color: GOLD },

    // 뾰족한 부분 (y=12)
    { x: 42, y: 12, color: LIGHT_GOLD },
    { x: 45, y: 12, color: LIGHT_GOLD },

    // 정상 (y=11)
    { x: 42, y: 11, color: GOLD },
    { x: 45, y: 11, color: GOLD },
  ];

  crownPixels.forEach(({ x, y, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  });

  console.log('✨ Golden Crown rendered at Head Overlay');
}
```

### 4.2 민팅 파이프라인 업데이트
**위치**: `src/lib/mintPipeline.ts` (수정)

```typescript
export interface MintPipelineOptions {
  address: `0x${string}`;
  apiKey: string;
  generationMethod: 'ai' | 'procedural';
  onProgress?: (stage: string, progress: number) => void;
  hasCCIPAttestation?: boolean; // ⭐ 새 필드
}

export async function executeMintPipeline(
  options: MintPipelineOptions
): Promise<MintPipelineResult> {
  const {
    address,
    apiKey,
    generationMethod,
    onProgress,
    hasCCIPAttestation = false // ⭐ 기본값 false
  } = options;

  try {
    // 1. Trait 생성
    onProgress?.('Generating traits...', 10);
    const traits = generateTraits(address);

    // 2. 스킨 텍스처 생성
    onProgress?.('Creating skin texture...', 25);
    let textureDataUrl: string;

    if (generationMethod === 'ai') {
      // ⭐ CCIP 플래그 전달
      textureDataUrl = await generateAISkin(traits, apiKey, hasCCIPAttestation);
    } else {
      textureDataUrl = createSkinTexture(traits);

      // Procedural 방식에서도 CCIP 요소 추가
      if (hasCCIPAttestation) {
        textureDataUrl = addCCIPVisualToProcedural(textureDataUrl);
      }
    }

    // 3-9. 기존 로직 (씬 생성, 애니메이션, GIF, 업로드...)
    // ... (변경 없음)

    // 10. 메타데이터 생성 (CCIP 속성 포함)
    onProgress?.('Generating metadata...', 85);
    const metadata = generateMetadata({
      tokenId: 0, // 임시
      gifCID,
      traits,
      hasCCIPAttestation // ⭐ 전달
    });

    onProgress?.('Complete!', 100);

    return {
      success: true,
      traits,
      gifUrl: `ipfs://${gifCID}`,
      metadataUri: `ipfs://${metadataCID}`,
      hasCCIPBonus: hasCCIPAttestation
    };
  } catch (error) {
    console.error('Mint pipeline error:', error);
    throw error;
  }
}

/**
 * Procedural 텍스처에 CCIP 시각 요소 추가
 */
function addCCIPVisualToProcedural(dataUrl: string): string {
  const img = new Image();
  img.src = dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(img, 0, 0);
  renderGoldenCrown(ctx); // 동일한 함수 재사용

  return canvas.toDataURL();
}
```

### 4.3 메타데이터에 CCIP 속성 추가
**위치**: `src/lib/mintPipeline.ts` (수정)

```typescript
function generateMetadata(options: {
  tokenId: number;
  gifCID: string;
  traits: SkinTraits;
  hasCCIPAttestation?: boolean;
}) {
  const { tokenId, gifCID, traits, hasCCIPAttestation } = options;

  const attributes = [
    { trait_type: "Skin Type", value: traits.skinType },
    { trait_type: "Head Accessory", value: traits.headAccessory },
    { trait_type: "Body Pattern", value: traits.bodyPattern },
    { trait_type: "Arm Style", value: traits.armStyle },
    { trait_type: "Leg Style", value: traits.legStyle },
    { trait_type: "Face Type", value: traits.faceType },
    { trait_type: "Eye Color", value: traits.eyeColor },
    { trait_type: "Hair Color", value: traits.hairColor },
    { trait_type: "Shirt Color", value: traits.shirtColor },
    { trait_type: "Pants Color", value: traits.pantsColor },
    { trait_type: "Shoes Color", value: traits.shoesColor },
  ];

  // ⭐ CCIP 속성 추가
  if (hasCCIPAttestation) {
    attributes.push(
      {
        trait_type: "CCIP Verified",
        value: "Yes"
      },
      {
        trait_type: "Cross-Chain NFT Holder",
        value: "Ethereum Sepolia"
      },
      {
        trait_type: "Special Trait",
        value: "Golden Crown"
      },
      {
        trait_type: "Rarity",
        value: "Legendary"
      }
    );
  }

  return {
    name: `Minecraft PFP #${tokenId}`,
    description: hasCCIPAttestation
      ? "A unique Minecraft-style PFP NFT with special cross-chain verified traits, featuring a golden crown earned by proving NFT ownership on Ethereum Sepolia."
      : "A unique Minecraft-style PFP NFT generated based on your wallet address and on-chain wealth.",
    image: `ipfs://${gifCID}`,
    animation_url: `ipfs://${gifCID}`,
    attributes,
  };
}
```

---

## 🔌 Phase 5: API 엔드포인트 구현

### 5.1 Sepolia NFT 소유권 확인 API
**위치**: `src/app/api/ccip/check-sepolia-nft/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const SEPOLIA_NFT_CONTRACT = process.env.SEPOLIA_NFT_CONTRACT as `0x${string}`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address') as `0x${string}`;

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const client = createPublicClient({
      chain: sepolia,
      transport: http(process.env.SEPOLIA_RPC_URL)
    });

    // ERC721.balanceOf() 호출
    const balance = await client.readContract({
      address: SEPOLIA_NFT_CONTRACT,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'owner', type: 'address' }],
          outputs: [{ name: 'balance', type: 'uint256' }]
        }
      ],
      functionName: 'balanceOf',
      args: [address]
    });

    const hasNFT = balance > 0n;

    // 소유한 토큰 ID 조회 (간단히 하기 위해 1-10 범위 체크)
    const tokenIds: number[] = [];
    if (hasNFT) {
      for (let i = 0; i < 10; i++) {
        try {
          const owner = await client.readContract({
            address: SEPOLIA_NFT_CONTRACT,
            abi: [
              {
                name: 'ownerOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: 'owner', type: 'address' }]
              }
            ],
            functionName: 'ownerOf',
            args: [BigInt(i)]
          });

          if (owner.toLowerCase() === address.toLowerCase()) {
            tokenIds.push(i);
          }
        } catch {
          // 토큰 존재하지 않음
        }
      }
    }

    return NextResponse.json({
      hasNFT,
      balance: balance.toString(),
      tokenIds
    });
  } catch (error) {
    console.error('NFT check error:', error);
    return NextResponse.json({ error: 'Failed to check NFT' }, { status: 500 });
  }
}
```

### 5.2 CCIP Attestation 상태 확인 API
**위치**: `src/app/api/ccip/attestation-status/[address]/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sql } from '@/lib/db';

const MONAD_CCIP_RECEIVER = process.env.NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS as `0x${string}`;

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address as `0x${string}`;

  try {
    // 1. 온체인에서 확인
    const client = createPublicClient({
      chain: {
        id: 10143,
        name: 'Monad Testnet',
        network: 'monad-testnet',
        nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
        rpcUrls: {
          default: { http: [process.env.MONAD_TESTNET_RPC_URL!] },
          public: { http: [process.env.MONAD_TESTNET_RPC_URL!] }
        }
      },
      transport: http()
    });

    const hasAttestation = await client.readContract({
      address: MONAD_CCIP_RECEIVER,
      abi: [
        {
          name: 'hasValidAttestation',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'user', type: 'address' }],
          outputs: [{ name: 'valid', type: 'bool' }]
        }
      ],
      functionName: 'hasValidAttestation',
      args: [address]
    });

    // 2. DB에서 상세 정보 조회
    const attestation = await sql`
      SELECT * FROM ccip_attestations
      WHERE monad_address = ${address.toLowerCase()}
      AND status IN ('received', 'pending')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (attestation.length === 0) {
      return NextResponse.json({
        hasAttestation: false,
        status: null
      });
    }

    return NextResponse.json({
      hasAttestation,
      attestationId: attestation[0].attestation_id,
      receivedAt: attestation[0].monad_received_at,
      status: attestation[0].status,
      sepoliaNFT: {
        address: attestation[0].sepolia_nft_address,
        tokenId: attestation[0].sepolia_token_id
      }
    });
  } catch (error) {
    console.error('Attestation check error:', error);
    return NextResponse.json({ error: 'Failed to check attestation' }, { status: 500 });
  }
}
```

### 5.3 CCIP 메시지 기록 API
**위치**: `src/app/api/ccip/record-message/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      monadAddress,
      sepoliaNFTAddress,
      sepoliaTokenId,
      ccipMessageId,
      attestationId,
      sepoliaTxHash
    } = body;

    // DB에 기록
    await sql`
      INSERT INTO ccip_attestations (
        monad_address,
        sepolia_nft_address,
        sepolia_token_id,
        ccip_message_id,
        attestation_id,
        source_chain_selector,
        sepolia_tx_hash,
        status
      ) VALUES (
        ${monadAddress.toLowerCase()},
        ${sepoliaNFTAddress.toLowerCase()},
        ${sepoliaTokenId},
        ${ccipMessageId},
        ${attestationId},
        ${process.env.SEPOLIA_CHAIN_SELECTOR},
        ${sepoliaTxHash},
        'pending'
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record message error:', error);
    return NextResponse.json({ error: 'Failed to record message' }, { status: 500 });
  }
}
```

### 5.4 CCIP 메시지 모니터링 API
**위치**: `src/app/api/ccip/monitor/[messageId]/route.ts` (신규)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;

  try {
    const attestation = await sql`
      SELECT * FROM ccip_attestations
      WHERE ccip_message_id = ${messageId}
      LIMIT 1
    `;

    if (attestation.length === 0) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const data = attestation[0];

    // 상태에 따라 진행률 계산
    let progress = 25;
    let estimatedTime = '15-30 minutes';

    if (data.status === 'received') {
      progress = 75;
      estimatedTime = '5-10 minutes';
    } else if (data.status === 'used') {
      progress = 100;
      estimatedTime = 'Complete';
    }

    return NextResponse.json({
      messageId,
      status: data.status,
      progress,
      estimatedTime,
      receivedAt: data.monad_received_at
    });
  } catch (error) {
    console.error('Monitor error:', error);
    return NextResponse.json({ error: 'Failed to monitor message' }, { status: 500 });
  }
}
```

---

## 🎯 Phase 6: 메인 페이지 통합

### 6.1 메인 페이지 UI 업데이트
**위치**: `src/app/page.tsx` (수정)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { SepoliaNFTVerification } from '@/components/SepoliaNFTVerification';
import { CCIPStatusMonitor } from '@/components/CCIPStatusMonitor';
import { MinecraftSkinViewer } from '@/components/MinecraftSkinViewer';
import { executeMintPipeline } from '@/lib/mintPipeline';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [hasAttestation, setHasAttestation] = useState(false);
  const [ccipMessageId, setCCIPMessageId] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);

  // Attestation 상태 확인
  useEffect(() => {
    if (address) {
      checkAttestationStatus();
    }
  }, [address]);

  async function checkAttestationStatus() {
    try {
      const response = await fetch(`/api/ccip/attestation-status/${address}`);
      const data = await response.json();
      setHasAttestation(data.hasAttestation);
    } catch (error) {
      console.error('Failed to check attestation:', error);
    }
  }

  async function handleMint() {
    if (!address) return;

    setMinting(true);
    try {
      // 민팅 파이프라인 실행 (CCIP 플래그 포함)
      const result = await executeMintPipeline({
        address,
        apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY!,
        generationMethod: 'ai',
        hasCCIPAttestation: hasAttestation, // ⭐
        onProgress: (stage, progress) => {
          console.log(`${stage}: ${progress}%`);
        }
      });

      // 컨트랙트 민팅 호출
      // ... (기존 민팅 로직)

      console.log('Mint complete!', result);
    } catch (error) {
      console.error('Mint failed:', error);
    } finally {
      setMinting(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Minecraft PFP NFT</h1>

      {/* CCIP Attestation Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">
          🌉 Cross-Chain NFT Verification
        </h2>
        <p className="mb-4">
          Own an NFT on Ethereum Sepolia? Get a special <strong>Golden Crown</strong> trait on Monad!
        </p>

        {isConnected ? (
          <>
            <SepoliaNFTVerification onMessageSent={setCCIPMessageId} />

            {/* CCIP 전송 상태 모니터링 */}
            {ccipMessageId && address && (
              <CCIPStatusMonitor
                messageId={ccipMessageId}
                monadAddress={address}
              />
            )}
          </>
        ) : (
          <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
            Please connect your wallet to verify NFT ownership
          </div>
        )}
      </section>

      {/* Mint Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Mint Your PFP</h2>

        {/* Attestation 상태 표시 */}
        {hasAttestation && (
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
            <p className="font-bold">✨ CCIP Attestation Verified!</p>
            <p>
              Your NFT will have a special <strong>Golden Crown</strong> trait
              and Legendary rarity status.
            </p>
          </div>
        )}

        {/* 스킨 미리보기 */}
        {address && (
          <MinecraftSkinViewer address={address} />
        )}

        {/* 민팅 버튼 */}
        <button
          onClick={handleMint}
          disabled={!isConnected || minting}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {minting ? 'Minting...' : 'Mint NFT'}
        </button>
      </section>
    </main>
  );
}
```

---

## 📝 Phase 7: 환경 변수 설정

### .env.local 파일 업데이트
```bash
# ==========================================
# Monad Testnet (기존)
# ==========================================
MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_API_KEY=your_api_key
PRIVATE_KEY=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # MinecraftPFPWithWealth
NEXT_PUBLIC_CHAIN_ID=10143

# ==========================================
# Sepolia Testnet (새로 추가)
# ==========================================
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111

# ==========================================
# CCIP Configuration (새로 추가)
# ==========================================
# Sepolia
NEXT_PUBLIC_SEPOLIA_CCIP_ROUTER=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
SEPOLIA_CHAIN_SELECTOR=16015286601757825753
NEXT_PUBLIC_SEPOLIA_LINK_TOKEN=0x779877A7B0D9E8603169DdbD7836e478b4624789

# Monad
NEXT_PUBLIC_MONAD_CCIP_ROUTER=0x5f16...3E54
MONAD_CHAIN_SELECTOR=2183018362218727504

# ==========================================
# NFT Contracts (환경변수로 설정)
# ==========================================
# Sepolia에서 검증할 NFT 컬렉션 주소
NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT=0x...

# 배포 후 추가될 주소들
NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=0x... # NFTOwnershipVerifier
NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS=0x... # MonadCCIPReceiver

# ==========================================
# Database (기존)
# ==========================================
DATABASE_URL=postgresql://...

# ==========================================
# AI & Storage (기존)
# ==========================================
NEXT_PUBLIC_CLAUDE_API_KEY=sk-...
```

---

## 🧪 Phase 8: 테스트

### 8.1 스마트 컨트랙트 테스트
**위치**: `test/ccip/NFTOwnershipVerifier.test.ts` (신규)

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTOwnershipVerifier", function () {
  let verifier: any;
  let mockNFT: any;
  let mockRouter: any;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Mock NFT 배포
    const MockNFT = await ethers.getContractFactory("MockERC721");
    mockNFT = await MockNFT.deploy("TestNFT", "TNFT");

    // Mock CCIP Router 배포
    const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
    mockRouter = await MockRouter.deploy();

    // Verifier 배포
    const Verifier = await ethers.getContractFactory("NFTOwnershipVerifier");
    verifier = await Verifier.deploy(mockRouter.address);

    // NFT 지원 추가
    await verifier.addSupportedNFT(mockNFT.address);

    // User에게 NFT 발행
    await mockNFT.mint(user.address, 1);
  });

  it("Should create attestation for NFT owner", async function () {
    const tx = await verifier.connect(user).createAttestation(mockNFT.address, 1);
    const receipt = await tx.wait();

    const event = receipt.events.find((e: any) => e.event === "AttestationCreated");
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

    // Bridge 시도 시 실패해야 함 (더 이상 소유자 아님)
    await expect(
      verifier.connect(user).bridgeAttestation(attestationId, 123, owner.address)
    ).to.be.revertedWith("No longer the owner");
  });
});
```

### 8.2 E2E 테스트 체크리스트
```markdown
## E2E 테스트 시나리오

### Happy Path
- [ ] Sepolia 네트워크 연결
- [ ] NFT 소유권 확인
- [ ] Attestation 생성
- [ ] CCIP 메시지 전송
- [ ] Monad에서 수신 확인
- [ ] Monad에서 민팅 (특수 trait 포함)
- [ ] 메타데이터 확인

### Edge Cases
- [ ] NFT 미소유자 접근 시도 → 차단
- [ ] Attestation 생성 후 NFT 전송 → Bridge 실패
- [ ] 만료된 Attestation 사용 시도 → 거부
- [ ] 중복 Attestation 사용 → 거부
- [ ] 신뢰하지 않는 Verifier 메시지 → 차단

### UI/UX
- [ ] 네트워크 전환 플로우
- [ ] CCIP 전송 상태 표시
- [ ] 골든 크라운 렌더링 확인
- [ ] 메타데이터 속성 확인
```

---

## 📄 새로 생성할 파일 목록 (총 18개)

### 스마트 컨트랙트 (3개)
1. `contracts/sepolia/NFTOwnershipVerifier.sol`
2. `contracts/monad/MonadCCIPReceiver.sol`
3. `contracts/interfaces/IMonadCCIPReceiver.sol`

### 배포 스크립트 (3개)
4. `scripts/deploy-ccip.ts`
5. `scripts/verify-contracts.ts`
6. `hardhat.config.sepolia.ts`

### 데이터베이스 (1개)
7. `src/lib/db/migrations/002_ccip_attestations.sql`

### 프론트엔드 컴포넌트 (3개)
8. `src/components/SepoliaNFTVerification.tsx`
9. `src/components/CCIPStatusMonitor.tsx`
10. `src/components/SepoliaConnectButton.tsx` (선택)

### API Routes (4개)
11. `src/app/api/ccip/check-sepolia-nft/route.ts`
12. `src/app/api/ccip/attestation-status/[address]/route.ts`
13. `src/app/api/ccip/record-message/route.ts`
14. `src/app/api/ccip/monitor/[messageId]/route.ts`

### 유틸리티 (1개)
15. `src/lib/chains.ts`

### 테스트 (3개)
16. `test/ccip/NFTOwnershipVerifier.test.ts`
17. `test/ccip/MonadCCIPReceiver.test.ts`
18. `test/ccip/integration.test.ts`

---

## 🔧 수정할 기존 파일 목록 (6개)

1. **contracts/monad/MinecraftPFPWithWealth.sol**
   - `ccipReceiver` 상태 변수 추가
   - `hasCCIPBonus` 매핑 추가
   - `setCCIPReceiver()` 함수 추가
   - `mint()` 함수에 attestation 체크 로직 추가
   - `getTokenCCIPStatus()` 조회 함수 추가
   - `CCIPBonusGranted` 이벤트 추가

2. **src/lib/wagmi.ts**
   - `chains` 배열에 Sepolia 추가

3. **src/lib/mintPipeline.ts**
   - `MintPipelineOptions`에 `hasCCIPAttestation` 필드 추가
   - `executeMintPipeline()`에 CCIP 플래그 처리 로직 추가
   - `generateMetadata()`에 CCIP 속성 추가 로직
   - `addCCIPVisualToProcedural()` 함수 추가

4. **src/lib/aiSkinGenerator.ts**
   - `generateAISkin()`에 `hasCCIPAttestation` 파라미터 추가
   - `renderGoldenCrown()` 함수 추가
   - CCIP 플래그 체크 및 크라운 렌더링 로직

5. **src/app/page.tsx**
   - CCIP 섹션 추가
   - Attestation 상태 확인 로직
   - `SepoliaNFTVerification` 컴포넌트 통합
   - `CCIPStatusMonitor` 컴포넌트 통합
   - 민팅 시 `hasCCIPAttestation` 전달

6. **src/lib/db/schema.sql**
   - `skins` 테이블에 `has_ccip_attestation`, `ccip_attestation_id` 필드 추가

---

## ⏱️ 예상 구현 시간

| Phase | 작업 내용 | 예상 시간 |
|-------|----------|----------|
| **Phase 1** | 스마트 컨트랙트 개발 | 4-5시간 |
| **Phase 2** | 데이터베이스 스키마 | 30분 |
| **Phase 3** | Sepolia 연동 UI | 2-3시간 |
| **Phase 4** | 시각적 요소 렌더링 | 1-2시간 |
| **Phase 5** | API 엔드포인트 | 1-2시간 |
| **Phase 6** | 메인 페이지 통합 | 1-2시간 |
| **Phase 7** | 환경 변수 설정 | 30분 |
| **Phase 8** | 테스트 및 디버깅 | 2-3시간 |
| **총 예상 시간** | | **12-18시간** |

---

## ✅ 구현 체크리스트

### Smart Contracts
- [ ] NFTOwnershipVerifier.sol 작성
- [ ] MonadCCIPReceiver.sol 작성
- [ ] MinecraftPFPWithWealth.sol 업데이트
- [ ] IMonadCCIPReceiver.sol 인터페이스 작성
- [ ] 배포 스크립트 작성 (deploy-ccip.ts)
- [ ] 컨트랙트 테스트 작성
- [ ] Sepolia에 배포
- [ ] Monad에 배포
- [ ] 화이트리스트 설정
- [ ] MinecraftPFP에 CCIPReceiver 연결

### Database
- [ ] ccip_attestations 테이블 생성
- [ ] skins 테이블 확장 (has_ccip_attestation, ccip_attestation_id)
- [ ] 마이그레이션 실행
- [ ] 인덱스 생성 확인

### Frontend - Sepolia Integration
- [ ] Sepolia 체인 설정 추가 (chains.ts)
- [ ] Wagmi 멀티체인 설정
- [ ] SepoliaNFTVerification 컴포넌트 구현
- [ ] CCIPStatusMonitor 컴포넌트 구현
- [ ] 네트워크 전환 UI

### Frontend - Visual Elements
- [ ] renderGoldenCrown() 함수 구현
- [ ] AI 스킨 생성에 CCIP 플래그 추가
- [ ] Procedural 스킨에도 CCIP 요소 추가
- [ ] 메타데이터에 CCIP 속성 추가
- [ ] 민팅 파이프라인 업데이트

### API Endpoints
- [ ] /api/ccip/check-sepolia-nft (GET)
- [ ] /api/ccip/attestation-status/[address] (GET)
- [ ] /api/ccip/record-message (POST)
- [ ] /api/ccip/monitor/[messageId] (GET)

### Integration
- [ ] 메인 페이지 CCIP 섹션 추가
- [ ] Attestation 상태 표시
- [ ] 민팅 플로우에 attestation 체크 통합
- [ ] 환경 변수 설정 (.env.local)
- [ ] E2E 테스트

### Documentation
- [ ] README 업데이트 (CCIP 기능 설명)
- [ ] 사용자 가이드 작성
- [ ] 배포 가이드 문서화

---

## 🚀 시작 순서 및 권장사항

### 1단계: 환경 설정 (30분)
1. `.env.local`에 Sepolia RPC URL 추가
2. Sepolia NFT 컬렉션 주소 설정
3. CCIP Router 주소 확인
4. 데이터베이스 마이그레이션 준비

### 2단계: 스마트 컨트랙트 (4-5시간)
1. `NFTOwnershipVerifier.sol` 작성 및 테스트
2. `MonadCCIPReceiver.sol` 작성 및 테스트
3. `MinecraftPFPWithWealth.sol` 업데이트
4. 로컬 테스트넷에서 통합 테스트
5. Sepolia 및 Monad 배포

### 3단계: 데이터베이스 (30분)
1. 마이그레이션 SQL 작성
2. 로컬에서 마이그레이션 실행
3. 스키마 검증

### 4단계: 백엔드 API (1-2시간)
1. API 엔드포인트 구현
2. 로컬 테스트

### 5단계: 프론트엔드 UI (3-4시간)
1. Sepolia 체인 지원 추가
2. `SepoliaNFTVerification` 컴포넌트
3. `CCIPStatusMonitor` 컴포넌트
4. 메인 페이지 통합

### 6단계: 시각적 요소 (1-2시간)
1. `renderGoldenCrown()` 구현
2. AI 스킨 생성 업데이트
3. 메타데이터 수정

### 7단계: E2E 테스트 (2-3시간)
1. Sepolia에서 NFT 민팅 (테스트용)
2. 전체 플로우 테스트
3. 버그 수정

---

## 🎯 핵심 구현 포인트

### 1. CCIP 보안
- ✅ 화이트리스트 기반 신뢰 모델
- ✅ Attestation 만료 관리 (7일)
- ✅ 중복 사용 방지 (used 플래그)
- ✅ NFT 소유권 재검증 (bridge 시)

### 2. 사용자 경험
- ✅ 명확한 네트워크 전환 가이드
- ✅ CCIP 전송 상태 실시간 모니터링
- ✅ 예상 대기 시간 표시 (15-30분)
- ✅ 특수 trait 시각적 강조

### 3. 성능 최적화
- ✅ CCIP 메시지 크기 최소화
- ✅ 가스비 최적화 (Packed Storage)
- ✅ DB 인덱싱
- ✅ API 응답 캐싱

---

## 📚 참고 자료

### Chainlink CCIP
- [CCIP 공식 문서](https://docs.chain.link/ccip)
- [Monad Testnet CCIP 설정](https://docs.monad.xyz/testnet/ccip)
- [CCIP Chain Selectors](https://docs.chain.link/ccip/supported-networks)
- [CCIP Explorer](https://ccip.chain.link/)

### Monad
- [Monad Testnet RPC](https://docs.monad.xyz/testnet)
- [Monad Faucet](https://faucet.monad.xyz)

### Ethereum Sepolia
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Sepolia Explorer](https://sepolia.etherscan.io/)

---

## 🔄 향후 확장 가능성

1. **다중 체인 지원**: Base, Optimism, Arbitrum 등 추가
2. **동적 trait 업그레이드**: 추가 NFT 보유 시 trait 변경
3. **CCIP 토큰 브릿징**: NFT 자체를 브릿징
4. **커뮤니티 투표**: CCIP를 통한 크로스체인 거버넌스
5. **레벨 시스템**: 다양한 체인에서 활동에 따라 레벨업

---

**이 문서는 Ethereum Sepolia NFT 소유권 검증을 통한 Monad Testnet 특수 Trait 민팅 시스템의 완전한 구현 청사진입니다.**

다음 세션에서 이 계획을 기반으로 단계별 구현을 진행하시면 됩니다! 🚀

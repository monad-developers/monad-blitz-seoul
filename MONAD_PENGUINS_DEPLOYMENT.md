# Monad Penguins 배포 가이드

## 📋 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [배포 단계](#배포-단계)
4. [배포 후 설정](#배포-후-설정)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

---

## 개요

Monad Penguins는 Ethereum Sepolia 테스트넷에 배포되는 ERC721 NFT 컬렉션입니다.

**주요 특징**:
- 총 공급량: 1,000개
- 민팅 가격: 0.001 Sepolia ETH
- 결정론적 trait 생성 시스템
- CCIP를 통한 Monad Testnet과의 크로스체인 연동

---

## 사전 준비

### 1. 환경 변수 설정

`.env` 파일에 다음 변수들을 추가하세요:

```bash
# Sepolia RPC URL (Infura, Alchemy 등)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 배포자 Private Key
PRIVATE_KEY=0x...

# Etherscan API Key (컨트랙트 검증용)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Monad Penguins Base URI (IPFS 업로드 후 설정)
MONAD_PENGUINS_BASE_URI=ipfs://QmYourCID/

# 배포 후 추가될 컨트랙트 주소
MONAD_PENGUINS_ADDRESS=
```

### 2. Sepolia ETH 확보

배포자 지갑에 최소 **0.01 Sepolia ETH** 필요:
- [Sepolia Faucet 1](https://sepoliafaucet.com/)
- [Sepolia Faucet 2](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Sepolia Faucet 3](https://faucet.quicknode.com/ethereum/sepolia)

### 3. 의존성 설치

```bash
pnpm install
```

---

## 배포 단계

### Step 1: 컴파일

```bash
npx hardhat compile
```

예상 출력:
```
Compiled 1 Solidity file successfully
```

### Step 2: 배포

```bash
npx hardhat run scripts/deploy-monad-penguins.ts --network sepolia
```

예상 출력:
```
🐧 Monad Penguins NFT 컬렉션 배포 시작...

📡 Network: sepolia (Chain ID: 11155111)
👤 Deployer: 0x...
💰 Balance: 0.1 ETH
✅ 잔액 확인 완료

📋 설정 정보:
  Base Token URI: ipfs://QmTempBaseURI/
  Max Supply: 1,000
  Mint Price: 0.001 ETH

⏳ MonadPenguins 컨트랙트 배포 중...
⏳ 배포 트랜잭션 대기 중...
✅ Contract deployed to: 0xABCDEF...

🔍 컨트랙트 정보 확인 중...
  Name: Monad Penguins
  Symbol: MPEN
  Max Supply: 1000
  Mint Price: 0.001 ETH
  Total Minted: 0

📝 배포 정보:
{
  "network": "sepolia",
  "chainId": "11155111",
  "contract": "0xABCDEF...",
  "deployer": "0x...",
  "timestamp": "2025-01-15T...",
  ...
}

💾 배포 정보가 저장되었습니다: deployments/monad-penguins_sepolia_....json

📌 다음 단계:
1. .env 파일에 컨트랙트 주소 추가:
   MONAD_PENGUINS_ADDRESS=0xABCDEF...

2. IPFS에 메타데이터 업로드 후 Base URI 업데이트:
   npx hardhat run scripts/update-penguin-uri.ts --network sepolia

3. NFTOwnershipVerifier에 MonadPenguins 추가:
   컨트랙트 주소: 0xABCDEF...

🔍 Etherscan 검증 명령어:
npx hardhat verify --network sepolia 0xABCDEF... "ipfs://QmTempBaseURI/"

✨ 배포 완료!
```

### Step 3: .env 업데이트

배포된 컨트랙트 주소를 `.env`에 추가:

```bash
MONAD_PENGUINS_ADDRESS=0xABCDEF...
```

### Step 4: Etherscan 검증

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "ipfs://QmTempBaseURI/"
```

예:
```bash
npx hardhat verify --network sepolia 0xABCDEF1234567890 "ipfs://QmTempBaseURI/"
```

성공 시:
```
Successfully verified contract MonadPenguins on Etherscan.
https://sepolia.etherscan.io/address/0xABCDEF...#code
```

---

## 배포 후 설정

### 1. 컨트랙트 검증

배포된 컨트랙트 상태 확인:

```bash
MONAD_PENGUINS_ADDRESS=0xABCDEF... npx hardhat run scripts/verify-penguin-contract.ts --network sepolia
```

### 2. IPFS 메타데이터 업로드

#### 2-1. 메타데이터 구조

각 펭귄 NFT의 메타데이터 JSON 파일을 생성합니다:

**예시**: `1.json`
```json
{
  "name": "Monad Penguin #1",
  "description": "A lost penguin from the Monad chain, waiting to be rescued.",
  "image": "ipfs://QmImageCID/1.png",
  "animation_url": "ipfs://QmAnimationCID/1.gif",
  "attributes": [
    { "trait_type": "Body Color", "value": "Classic White & Black" },
    { "trait_type": "Beak Type", "value": "Standard Orange" },
    { "trait_type": "Eye Type", "value": "Curious Eyes" },
    { "trait_type": "Accessory", "value": "Red Scarf" },
    { "trait_type": "Background", "value": "Aurora Borealis" },
    { "trait_type": "Rarity", "value": "Rare" },
    { "trait_type": "Rescue Number", "value": "1" }
  ]
}
```

#### 2-2. IPFS 업로드 (Pinata 사용 예시)

1. [Pinata](https://www.pinata.cloud/) 가입
2. 메타데이터 폴더를 ZIP으로 압축
3. Pinata에 업로드
4. CID 확인: `QmYourMetadataCID`

#### 2-3. Base URI 업데이트

```bash
MONAD_PENGUINS_ADDRESS=0xABCDEF... \
MONAD_PENGUINS_BASE_URI=ipfs://QmYourMetadataCID/ \
npx hardhat run scripts/update-penguin-uri.ts --network sepolia
```

**주의**: Base URI 끝에 `/`를 꼭 포함해야 합니다!

### 3. 테스트 민팅

```bash
MONAD_PENGUINS_ADDRESS=0xABCDEF... npx hardhat run scripts/test-mint-penguin.ts --network sepolia
```

예상 출력:
```
🐧 Monad Penguins 테스트 민팅 시작...

📍 Contract Address: 0xABCDEF...
📡 Network: sepolia (Chain ID: 11155111)
👤 Minter: 0x...
💰 Balance: 0.1 ETH

⏳ 컨트랙트 연결 중...
📋 민팅 전 상태:
  Mint Price:      0.001 ETH
  Total Supply:    0
  Minting Enabled: true

⏳ 민팅 중...
📝 Transaction Hash: 0x...
⏳ 트랜잭션 대기 중...
✅ Transaction confirmed in block 12345

🎉 민팅 성공!
  Token ID:      #1
  Rescue Number: 1
  Rarity:        Rare

📋 민팅 후 상태:
  Total Supply:  1
  Token Owner:   0x...

🐧 펭귄 Traits:
  Body Color:    0 Classic White & Black
  Beak Type:     0 Standard Orange
  Eye Type:      0 Curious Eyes
  Accessory:     1 Red Scarf
  Background:    2 Aurora Borealis
  Rarity:        1 Rare
  Rescue Number: 1

💰 컨트랙트 잔액: 0.001 ETH

✨ 테스트 민팅 완료!
```

---

## 테스트

### 1. 로컬 테스트 (Hardhat Network)

```bash
npx hardhat test test/MonadPenguins.test.ts
```

### 2. Sepolia 테스트넷에서 확인

1. **Etherscan에서 확인**:
   - https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
   - 트랜잭션 확인
   - 컨트랙트 코드 확인

2. **OpenSea Testnet에서 확인**:
   - https://testnets.opensea.io/assets/sepolia/YOUR_CONTRACT_ADDRESS/1
   - 메타데이터 렌더링 확인
   - 이미지 표시 확인

3. **직접 호출 테스트**:
   ```bash
   # 총 공급량 확인
   cast call <CONTRACT_ADDRESS> "totalSupply()(uint256)" --rpc-url $SEPOLIA_RPC_URL

   # 특정 토큰 소유자 확인
   cast call <CONTRACT_ADDRESS> "ownerOf(uint256)(address)" 1 --rpc-url $SEPOLIA_RPC_URL

   # Trait 확인
   cast call <CONTRACT_ADDRESS> "getTraits(uint256)" 1 --rpc-url $SEPOLIA_RPC_URL
   ```

---

## 문제 해결

### 문제 1: 가스비 부족

**증상**:
```
Error: insufficient funds for gas * price + value
```

**해결**:
- Sepolia Faucet에서 추가 ETH 받기
- 배포자 지갑 잔액 확인: `cast balance <YOUR_ADDRESS> --rpc-url $SEPOLIA_RPC_URL`

### 문제 2: Nonce too low

**증상**:
```
Error: nonce has already been used
```

**해결**:
```bash
# Nonce 초기화
npx hardhat clean
rm -rf cache artifacts
```

### 문제 3: 컨트랙트 검증 실패

**증상**:
```
Error: Verification failed
```

**해결**:
- Constructor 인자가 정확한지 확인
- Solidity 버전이 일치하는지 확인 (0.8.19)
- Etherscan API Key가 올바른지 확인

### 문제 4: IPFS 메타데이터 로딩 안 됨

**증상**:
- OpenSea에서 이미지가 표시되지 않음

**해결**:
- Base URI 끝에 `/` 포함 여부 확인
- IPFS Gateway 테스트: `https://ipfs.io/ipfs/QmYourCID/1.json`
- Pinata Pin 상태 확인

### 문제 5: 민팅이 비활성화됨

**증상**:
```
Error: Minting is disabled
```

**해결**:
```typescript
// Hardhat console 사용
const contract = await ethers.getContractAt("MonadPenguins", "0xABCDEF...");
await contract.setMintingEnabled(true);
```

---

## 유용한 명령어 모음

### 컨트랙트 정보 확인
```bash
# 이름 확인
cast call <CONTRACT_ADDRESS> "name()(string)" --rpc-url $SEPOLIA_RPC_URL

# 심볼 확인
cast call <CONTRACT_ADDRESS> "symbol()(string)" --rpc-url $SEPOLIA_RPC_URL

# 총 공급량
cast call <CONTRACT_ADDRESS> "totalSupply()(uint256)" --rpc-url $SEPOLIA_RPC_URL

# 남은 공급량
cast call <CONTRACT_ADDRESS> "remainingSupply()(uint256)" --rpc-url $SEPOLIA_RPC_URL
```

### 소유자 관리
```bash
# 현재 소유자
cast call <CONTRACT_ADDRESS> "owner()(address)" --rpc-url $SEPOLIA_RPC_URL

# 소유권 이전
cast send <CONTRACT_ADDRESS> "transferOwnership(address)" <NEW_OWNER> \
  --private-key $PRIVATE_KEY --rpc-url $SEPOLIA_RPC_URL
```

### 잔액 인출
```bash
# 컨트랙트 잔액 확인
cast balance <CONTRACT_ADDRESS> --rpc-url $SEPOLIA_RPC_URL

# 인출 (오너만 가능)
cast send <CONTRACT_ADDRESS> "withdraw()" \
  --private-key $PRIVATE_KEY --rpc-url $SEPOLIA_RPC_URL
```

---

## 다음 단계

1. **NFTOwnershipVerifier 업데이트**:
   - Sepolia의 NFTOwnershipVerifier 컨트랙트에 MonadPenguins 주소 추가
   - `addSupportedNFT(0xMonadPenguinsAddress)` 호출

2. **프론트엔드 통합**:
   - Sepolia 네트워크 지원 추가
   - Monad Penguins 갤러리 페이지 구현
   - CCIP 연동 UI 개발

3. **Monad 연동**:
   - CCIP 메시지 수신 확인
   - Minecraft PFP 민팅 시 특수 trait 렌더링 테스트

4. **마케팅**:
   - 트위터/디스코드 공지
   - 에어드랍 이벤트
   - 커뮤니티 빌딩

---

## 참고 자료

- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [OpenSea Testnet](https://testnets.opensea.io/)
- [Pinata IPFS](https://www.pinata.cloud/)
- [Chainlink CCIP Docs](https://docs.chain.link/ccip)
- [Monad Docs](https://docs.monad.xyz/)

---

**문의사항이 있으시면 GitHub Issues에 남겨주세요!** 🐧

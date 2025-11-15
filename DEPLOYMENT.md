# OXGame 배포 가이드

## 사전 준비

### 1. Monad 테스트넷 설정

MetaMask에 Monad 테스트넷 추가:

- **Network Name**: Monad Testnet
- **RPC URL**: `https://explorer.monad-testnet.category.xyz/api/eth-rpc`
- **Chain ID**: `10143`
- **Currency Symbol**: MON
- **Block Explorer**: `https://testnet.monadexplorer.com/`

### 2. 테스트 토큰 받기

Monad 테스트넷 파셋에서 MON 토큰을 받으세요.

### 3. 환경 변수 설정

```bash
cd contract
cp .env.example .env
```

`.env` 파일 수정:
```env
MONAD_RPC_URL=https://explorer.monad-testnet.category.xyz/api/eth-rpc
PRIVATE_KEY=your_wallet_private_key_here
```

## 배포 단계

### 1. 의존성 설치

```bash
cd contract
npm install
```

### 2. 컴파일

```bash
npm run compile
```

성공 시:
```
Compiled 1 Solidity file successfully
```

### 3. Monad 테스트넷에 배포

```bash
npm run deploy:oxgame
```

배포 성공 시 다음 정보가 출력됩니다:
- Deployer 주소
- OXGame 컨트랙트 주소
- Oracle 주소
- 각 풀 (ETH, LINK, BTC) 상태

### 4. 컨트랙트 검증 (선택사항)

```bash
npx hardhat verify \
  --network monad \
  <CONTRACT_ADDRESS> \
  <ORACLE_ADDRESS>
```

예시:
```bash
npx hardhat verify \
  --network monad \
  0xa6aD802896dAbEf770Cfd470Ea72172f66217681 \
  0x1234567890123456789012345678901234567890
```

## 로컬 테스트

로컬 Hardhat 네트워크에서 테스트:

```bash
# 로컬 노드 실행
npm run node

# 다른 터미널에서
npm run deploy:local
```

## 배포 후

### 컨트랙트 주소 저장

배포된 컨트랙트 주소를 기록해두세요:

```json
{
  "network": "monad-testnet",
  "chainId": 10143,
  "contracts": {
    "OXGame": "0x...",
    "Oracle": "0x..."
  }
}
```

### 프론트엔드 연동

프론트엔드 프로젝트의 환경 변수에 컨트랙트 주소 추가:

```env
NEXT_PUBLIC_OXGAME_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=10143
```

### ABI 파일

컴파일된 ABI는 다음 위치에 저장됩니다:
```
contract/artifacts/contracts/oxgame.sol/OXGame.json
```

프론트엔드에서 사용할 때 이 파일을 복사하세요.

## 문제 해결

### 가스 부족 오류

```
Error: insufficient funds for intrinsic transaction cost
```

해결: 파셋에서 더 많은 MON 토큰을 받으세요.

### 네트워크 연결 오류

```
Error: could not detect network
```

해결: RPC URL과 Chain ID가 올바른지 확인하세요.

### 컴파일 오류

```
Error: Solidity version mismatch
```

해결:
```bash
rm -rf cache artifacts
npm run compile
```

## 다음 단계

1. **프론트엔드 개발**: Next.js 앱에서 컨트랙트 연동
2. **백엔드 개발**: NestJS로 게임 로직 및 오라클 구현
3. **테스트**: 통합 테스트 및 사용자 테스트

## 참고

- [Hardhat 문서](https://hardhat.org/docs)
- [Monad 문서](https://docs.monad.xyz/)
- [ethers.js 문서](https://docs.ethers.org/)

# OXGame Smart Contract

Monad 테스트넷에서 실행되는 OX 게임 스마트 컨트랙트

## 프로젝트 구조

```
contract/
├── contracts/
│   └── oxgame.sol          # OX 게임 메인 컨트랙트
├── scripts/
│   └── deploy-oxgame.ts    # 배포 스크립트
├── test/
│   └── SimpleStorage.test.ts
├── hardhat.config.ts       # Hardhat 설정 (Monad 테스트넷)
├── .env.example            # 환경 변수 예시
└── package.json
```

## 설정

### 1. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 설정:

```bash
cp .env.example .env
```

`.env` 파일:
```env
MONAD_RPC_URL=https://explorer.monad-testnet.category.xyz/api/eth-rpc
PRIVATE_KEY=your_private_key_here
```

### 2. 의존성 설치

```bash
npm install
```

## 컨트랙트 정보

### OXGame

- **입장료**: 1 MON
- **최대 플레이어**: 10명
- **라운드 시간**: 5초
- **풀 종류**: ETH, LINK, BTC (3개 체인 타입)

### 주요 기능

1. **joinPool(ChainType)** - 풀 참여 (1 MON 예치)
2. **startRound(ChainType, answer)** - 라운드 시작 (오라클만 가능)
3. **submitAnswer(ChainType, answer)** - 답변 제출
4. **getPoolInfo(ChainType)** - 풀 정보 조회
5. **getPlayerInfo(ChainType, address)** - 플레이어 정보 조회

## 사용법

### 컴파일

```bash
npm run compile
```

### 배포

#### Monad 테스트넷에 배포

```bash
npm run deploy:oxgame
```

#### 로컬 테스트넷에 배포

```bash
npm run deploy:local
```

### 컨트랙트 검증

```bash
npm run verify:oxgame <CONTRACT_ADDRESS> <ORACLE_ADDRESS>
```

예시:
```bash
npx hardhat verify \
  --network monad \
  0x1234... \
  0x5678...
```

## Monad 테스트넷 정보

- **Network Name**: Monad Testnet
- **RPC URL**: https://explorer.monad-testnet.category.xyz/api/eth-rpc
- **Chain ID**: 10143
- **Explorer**: https://testnet.monadexplorer.com/
- **Faucet**: [Monad Testnet Faucet]

## Hardhat 설정

`hardhat.config.ts`는 Monad 테스트넷용으로 설정되어 있습니다:

```typescript
networks: {
  monad: {
    url: "https://explorer.monad-testnet.category.xyz/api/eth-rpc",
    chainId: 10143,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

## 보안 주의사항

- `.env` 파일을 절대 커밋하지 마세요
- 프라이빗 키를 안전하게 관리하세요
- 메인넷 배포 전 감사를 받으세요

## 라이선스

MIT

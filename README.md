<<<<<<< HEAD
# Monad Blitz Seoul Submission Process

1. Visit the `monad-blitz-seoul` repo (link [here](https://github.com/monad-developers/monad-blitz-seoul)) and fork it.

<img width="1511" alt="Screenshot 2025-07-07 at 10 17 05 AM" src="https://github.com/user-attachments/assets/341c6774-f5ea-484d-a700-28e89eee9f95" />

2. Give it your project name, a one-liner description, make sure you are forking `main` branch and click `Create Fork`.

<img width="1511" alt="Screenshot 2025-07-07 at 10 17 55 AM" src="https://github.com/user-attachments/assets/b4a60b3b-6fd9-42b8-ba38-77fd79f76986" />

3. In your fork you can make all the changes you want, add code of your project, create branches, add information to `README.md`, you can change anything and everything.
=======
# Mon Blitz - OXGame DApp

Monad 테스트넷에서 실행되는 OX 게임 탈중앙화 애플리케이션

## 프로젝트 구조

```
mon_blitz/
├── contract/           # Hardhat 스마트 컨트랙트
│   ├── contracts/
│   │   └── oxgame.sol
│   ├── scripts/
│   │   └── deploy-oxgame.ts
│   ├── hardhat.config.ts
│   └── package.json
│
├── frontend/           # Next.js 프론트엔드 (예정)
│   └── ...
│
├── backend/            # NestJS 백엔드 (예정)
│   └── ...
│
└── CLAUDE.md          # AI 어시스턴트 가이드
```

## 기술 스택

### Smart Contract
- Solidity ^0.8.25
- Hardhat
- Monad Testnet

### Frontend (예정)
- Next.js 15+ (App Router)
- React 19+
- TypeScript
- Tailwind CSS
- ethers.js / wagmi

### Backend (예정)
- NestJS
- TypeScript

## 시작하기

### 1. 스마트 컨트랙트 배포

```bash
cd contract

# 환경 변수 설정
cp .env.example .env
# .env 파일에 PRIVATE_KEY 입력

# 의존성 설치
npm install

# 컴파일
npm run compile

# Monad 테스트넷에 배포
npm run deploy:oxgame
```

### 2. 프론트엔드 (예정)

```bash
cd frontend
npm install
npm run dev
```

### 3. 백엔드 (예정)

```bash
cd backend
npm install
npm run start:dev
```

## Monad 테스트넷

- **RPC URL**: https://explorer.monad-testnet.category.xyz/api/eth-rpc
- **Chain ID**: 10143
- **Explorer**: https://testnet.monadexplorer.com/
- **Currency**: MON

## OXGame 컨트랙트

### 게임 규칙
1. 플레이어는 1 MON을 예치하고 풀에 참여
2. 최대 10명까지 참여 가능
3. ETH, LINK, BTC 3개의 풀 운영
4. 각 라운드마다 O/X 문제 출제 (5초 제한)
5. 오답 또는 시간 초과 시 탈락
6. 마지막 남은 플레이어가 상금 획득

### 주요 기능
- `joinPool(ChainType)`: 풀 참여
- `submitAnswer(ChainType, answer)`: 답변 제출
- `getPoolInfo(ChainType)`: 풀 상태 조회
- `getPlayerInfo(ChainType, address)`: 플레이어 정보 조회

## 개발 가이드

자세한 개발 규칙은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

## 라이선스

MIT
>>>>>>> blitz_original/main

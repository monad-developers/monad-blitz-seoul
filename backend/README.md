# OXGame Oracle Backend

5초마다 Chainlink 가격 데이터를 조회하고 스마트 컨트랙트를 호출하는 Oracle 백엔드

## 기능

- ⏰ **5초 Cron 스케줄러**: 자동으로 라운드 처리
- 📊 **Chainlink Data Streams API**: 실시간 암호화폐 가격 조회 (ETH, LINK, BTC)
- 🔗 **스마트 컨트랙트 연동**: processRound() 자동 호출
- 📡 **WebSocket 실시간 통신**: 가격 및 게임 상태 브로드캐스트
- 👂 **이벤트 리스닝**: 블록체인 이벤트 자동 감지

## 프로젝트 구조

```
backend/
├── src/
│   ├── chainlink/
│   │   └── chainlink.service.ts    # 가격 데이터 조회
│   ├── oracle/
│   │   └── oracle.service.ts       # 5초 스케줄러
│   ├── blockchain/
│   │   └── blockchain.service.ts   # 컨트랙트 상호작용
│   ├── game/
│   │   ├── game.gateway.ts         # WebSocket
│   │   └── game.controller.ts      # REST API
│   ├── common/
│   │   ├── config/
│   │   │   └── config.service.ts   # 환경 변수
│   │   └── constants/
│   │       └── chain-types.ts      # 체인 타입 정의
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## 설치 및 실행

### 1. 환경 변수 설정

`.env` 파일 설정:
```env
# Server
PORT=3001
NODE_ENV=development

# Monad Testnet
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=10143

# Smart Contract
OXGAME_V2_ADDRESS=0xd7DB3033F906771c37d54548267b61481e6CfbE9
ORACLE_PRIVATE_KEY=your_private_key_here

# Chainlink Data Streams API
# Get your API key from: https://chain.link/
# Leave empty to use without authentication (rate limited)
CHAINLINK_API_KEY=
```

**Chainlink API Key (선택사항)**:
- API 키 없이도 작동하지만, rate limit이 적용될 수 있습니다
- https://chain.link/ 에서 무료 API 키를 발급받을 수 있습니다
- API 키를 사용하면 더 높은 요청 한도를 받을 수 있습니다

### 2. 의존성 설치

```bash
npm install
```

### 3. 실행

#### 개발 모드 (자동 재시작)
```bash
npm run dev
```

#### 프로덕션 빌드
```bash
npm run build
npm start
```

## API 엔드포인트

### REST API

#### GET `/api/v1/health`
헬스 체크

응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T06:00:00Z",
  "service": "OXGame Oracle Backend"
}
```

#### GET `/api/v1/pools`
모든 풀 상태 조회

응답:
```json
{
  "pools": [
    {
      "chainType": "ETH",
      "totalDeposit": "5.0",
      "currentRound": 10,
      "isActive": true,
      "activePlayerCount": 7,
      "lastPrice": 3500.25,
      "roundNumber": 10
    }
  ]
}
```

#### GET `/api/v1/pools/:chainType`
특정 풀 상태 조회 (chainType: ETH, LINK, BTC)

### WebSocket 이벤트

#### 서버 → 클라이언트

1. **price-update**: 실시간 가격 (매 라운드)
```json
{
  "chainType": "ETH",
  "price": 3500.25,
  "timestamp": 1700000000
}
```

2. **round-start**: 새 라운드 시작
```json
{
  "chainType": "ETH",
  "roundNumber": 11,
  "basePrice": 3500.25,
  "question": "5초 후 ETH 가격이 올라갈까요?",
  "startTime": 1700000000,
  "deadline": 1700000005
}
```

3. **round-end**: 라운드 종료
```json
{
  "chainType": "ETH",
  "roundNumber": 10,
  "previousPrice": 3500.0,
  "currentPrice": 3502.5,
  "correctAnswer": true,
  "change": 2.5,
  "changePercent": 0.07
}
```

## Oracle 작동 원리

### 5초 주기 플로우

```
T=0s:
1. Chainlink에서 현재 가격 조회 (예: ETH $3,502)
2. 이전 가격과 비교 ($3,500)
3. 정답 계산: $3,502 > $3,500 → true (O/상승)
4. Contract.processRound(ChainType.ETH, true) 호출
5. WebSocket으로 round-end 브로드캐스트
6. 현재 가격 저장 (다음 라운드용)
7. WebSocket으로 round-start 브로드캐스트

T=5s:
위 과정 반복...
```

### Cron 스케줄

```typescript
@Cron('*/5 * * * * *')  // 5초마다
async executeRounds() {
  // ETH, LINK, BTC 모든 풀 처리
}
```

## Chainlink Data Streams API

이 프로젝트는 Chainlink의 공식 Data Streams API를 사용하여 실시간 가격 데이터를 조회합니다.

**지원하는 자산**:
- ETH/USD (Ethereum)
- LINK/USD (Chainlink)
- BTC/USD (Bitcoin)

**Feed IDs**:
```typescript
ETH:  0x00027bbaff688c906a3e20a34fe951715d1018d262a5b66e38eda027a674cd1b
LINK: 0x00036fe43f87884450b4c7e093cd5ed99cac6640d49ec252a4e6aa7e8c8c5f9e
BTC:  0x00037da06d56d083fe599397a4769a042d63aa73dc4ef57709d31e9971a5b439
```

**캐싱**:
- 5초 캐시 (라운드 주기와 일치)
- API 호출 최소화로 rate limit 방지
- 캐시 만료 시 자동으로 새 데이터 요청

## 로그 예시

```
[Bootstrap] ============================================================
[Bootstrap] 🎮 OXGame Oracle Backend Started
[Bootstrap] ============================================================
[Bootstrap] 🚀 Server running on: http://localhost:3001
[Bootstrap] 📡 WebSocket running on: ws://localhost:3001
[Bootstrap] 📊 API: http://localhost:3001/api/v1/health
[Bootstrap] ⏰ Oracle Scheduler: Every 5 seconds
[Bootstrap] ============================================================

[ChainlinkService] 📡 Using Chainlink Data Streams API with authentication
[BlockchainService] ✅ Blockchain connected
[BlockchainService] 📝 Contract: 0xd7DB3033F906771c37d54548267b61481e6CfbE9
[BlockchainService] 🔑 Oracle: 0xAeeAB5F3bBAA0B5778815090b59a6437D1B00Cf4
[BlockchainService] 👂 Event listeners started
[GameGateway] ✅ WebSocket Gateway initialized
[OracleService] 🤖 Oracle Service initialized

[OracleService] ⏰ Executing 5-second round cycle...
[OracleService] 📊 ETH Current Price: $3501.23
[OracleService] 💹 ETH Price Change: +$1.23 (0.04%)
[OracleService] ✅ ETH Correct Answer: O (UP)
[BlockchainService] 📤 Processing round for ETH - Answer: O (UP)
[BlockchainService] ✅ Round processed - TX: 0x1234567...
[GameGateway] 📢 Round End: ETH #10
[GameGateway] 📢 Round Start: ETH #11
```

## 블록체인 이벤트 자동 감지

백엔드는 다음 이벤트를 자동으로 감지합니다:

- `PlayerJoined`: 플레이어 참여
- `RoundStarted`: 라운드 시작 (컨트랙트에서)
- `RoundEnded`: 라운드 종료
- `PlayerEliminated`: 플레이어 탈락
- `GameEnded`: 게임 종료

## 다음 단계

1. ✅ 백엔드 구축 완료
2. ⏳ 프론트엔드 Next.js 앱 생성
3. ⏳ WebSocket 클라이언트 연동
4. ⏳ 실시간 차트 UI
5. ⏳ 통합 테스트

## 테스트

### 헬스 체크
```bash
curl http://localhost:3001/api/v1/health
```

### 풀 상태 조회
```bash
curl http://localhost:3001/api/v1/pools
curl http://localhost:3001/api/v1/pools/ETH
```

### WebSocket 테스트 (Browser Console)
```javascript
const socket = io('http://localhost:3001');

socket.on('connect', () => console.log('Connected'));
socket.on('price-update', (data) => console.log('Price:', data));
socket.on('round-start', (data) => console.log('Round Start:', data));
socket.on('round-end', (data) => console.log('Round End:', data));
```

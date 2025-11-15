# OXGame API 명세서

## REST API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

---

## 게임 관리

### 1. 활성 풀 목록 조회

**GET** `/pools`

응답:
```json
{
  "pools": [
    {
      "chainType": "ETH",
      "chainTypeId": 0,
      "totalDeposit": "5.0",
      "currentRound": 3,
      "isActive": true,
      "activePlayerCount": 7,
      "totalPlayerCount": 10,
      "lastRoundTime": "2025-11-15T06:00:00Z"
    }
  ]
}
```

### 2. 특정 풀 상세 조회

**GET** `/pools/:chainType`

응답:
```json
{
  "chainType": "ETH",
  "chainTypeId": 0,
  "totalDeposit": "5.0",
  "currentRound": 3,
  "isActive": true,
  "activePlayerCount": 7,
  "totalPlayerCount": 10,
  "players": [
    {
      "address": "0x123...",
      "correctRounds": 3,
      "isActive": true,
      "joinedAt": "2025-11-15T05:50:00Z"
    }
  ],
  "currentPrice": 3500.25,
  "priceHistory": [
    { "timestamp": 1700000000, "price": 3495.0 },
    { "timestamp": 1700000030, "price": 3500.25 }
  ]
}
```

### 3. 현재 라운드 정보

**GET** `/pools/:chainType/current-round`

응답:
```json
{
  "roundNumber": 3,
  "question": "5초 후 이더리움 가격이 올라갈까요?",
  "startPrice": 3500.25,
  "startTime": "2025-11-15T06:00:00Z",
  "endTime": "2025-11-15T06:00:05Z",
  "remainingTime": 3,
  "status": "active",
  "submissions": 5
}
```

---

## 플레이어 관리

### 4. 플레이어 정보 조회

**GET** `/players/:address`

응답:
```json
{
  "address": "0x123...",
  "pools": [
    {
      "chainType": "ETH",
      "correctRounds": 3,
      "isActive": true,
      "totalRoundsPlayed": 3,
      "joinedAt": "2025-11-15T05:50:00Z"
    }
  ],
  "totalWins": 2,
  "totalEarnings": "15.5",
  "winRate": 0.66
}
```

### 5. 리더보드

**GET** `/leaderboard`

쿼리 파라미터:
- `chainType` (optional): ETH, LINK, BTC
- `period` (optional): daily, weekly, all-time
- `limit` (default: 10)

응답:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "address": "0x123...",
      "wins": 5,
      "totalEarnings": "50.0",
      "winRate": 0.83,
      "avgCorrectRounds": 8.5
    }
  ],
  "period": "all-time",
  "updatedAt": "2025-11-15T06:00:00Z"
}
```

---

## 가격 데이터

### 6. 실시간 가격 조회

**GET** `/prices/:asset`

응답:
```json
{
  "asset": "ETH",
  "price": 3500.25,
  "timestamp": "2025-11-15T06:00:00Z",
  "source": "chainlink-data-streams",
  "decimals": 8
}
```

### 7. 가격 히스토리

**GET** `/prices/:asset/history`

쿼리 파라미터:
- `interval` (required): 1s, 5s, 1m, 5m, 1h
- `limit` (default: 100)

응답:
```json
{
  "asset": "ETH",
  "interval": "5s",
  "data": [
    { "timestamp": 1700000000, "price": 3495.0, "volume": 1000000 },
    { "timestamp": 1700000005, "price": 3500.25, "volume": 1050000 }
  ]
}
```

---

## 통계

### 8. 게임 통계

**GET** `/stats/game`

응답:
```json
{
  "totalGames": 150,
  "totalPlayers": 1200,
  "totalVolume": "500.0",
  "avgPlayersPerGame": 8,
  "avgRoundsPerGame": 5,
  "poolStats": {
    "ETH": {
      "games": 50,
      "players": 400,
      "volume": "200.0"
    },
    "LINK": {
      "games": 50,
      "players": 400,
      "volume": "150.0"
    },
    "BTC": {
      "games": 50,
      "players": 400,
      "volume": "150.0"
    }
  }
}
```

---

## WebSocket Events

### 서버 → 클라이언트 이벤트

#### 1. price-update
실시간 가격 업데이트

```json
{
  "event": "price-update",
  "data": {
    "chainType": "ETH",
    "price": 3500.25,
    "timestamp": 1700000000,
    "change24h": 2.5,
    "changePercent": 0.07
  }
}
```

#### 2. round-start
새 라운드 시작

```json
{
  "event": "round-start",
  "data": {
    "chainType": "ETH",
    "roundNumber": 4,
    "question": "5초 후 이더리움 가격이 올라갈까요?",
    "startPrice": 3500.25,
    "startTime": "2025-11-15T06:00:00Z",
    "duration": 5
  }
}
```

#### 3. round-end
라운드 종료

```json
{
  "event": "round-end",
  "data": {
    "chainType": "ETH",
    "roundNumber": 4,
    "answer": true,
    "startPrice": 3500.25,
    "endPrice": 3502.0,
    "correctPlayers": 5,
    "eliminatedPlayers": [
      "0x123...",
      "0x456..."
    ]
  }
}
```

#### 4. player-joined
플레이어 참여

```json
{
  "event": "player-joined",
  "data": {
    "chainType": "ETH",
    "address": "0x123...",
    "playerCount": 8
  }
}
```

#### 5. player-eliminated
플레이어 탈락

```json
{
  "event": "player-eliminated",
  "data": {
    "chainType": "ETH",
    "address": "0x123...",
    "roundNumber": 4,
    "remainingPlayers": 6
  }
}
```

#### 6. game-ended
게임 종료

```json
{
  "event": "game-ended",
  "data": {
    "chainType": "ETH",
    "winners": [
      "0x123..."
    ],
    "prizePerWinner": "10.0",
    "totalRounds": 8,
    "duration": 240
  }
}
```

#### 7. submission-received
답변 제출 확인

```json
{
  "event": "submission-received",
  "data": {
    "chainType": "ETH",
    "address": "0x123...",
    "roundNumber": 4,
    "answer": true,
    "timestamp": "2025-11-15T06:00:02Z"
  }
}
```

### 클라이언트 → 서버 이벤트

#### 1. subscribe-pool
풀 구독

```json
{
  "event": "subscribe-pool",
  "data": {
    "chainType": "ETH"
  }
}
```

#### 2. unsubscribe-pool
풀 구독 해제

```json
{
  "event": "unsubscribe-pool",
  "data": {
    "chainType": "ETH"
  }
}
```

#### 3. subscribe-price
가격 데이터 구독

```json
{
  "event": "subscribe-price",
  "data": {
    "assets": ["ETH", "LINK", "BTC"]
  }
}
```

---

## 에러 응답

모든 에러는 다음 형식을 따릅니다:

```json
{
  "statusCode": 400,
  "message": "Invalid chain type",
  "error": "Bad Request",
  "timestamp": "2025-11-15T06:00:00Z",
  "path": "/api/v1/pools/INVALID"
}
```

### 에러 코드

| 코드 | 설명 |
|------|------|
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 필요 |
| 404 | Not Found - 리소스를 찾을 수 없음 |
| 409 | Conflict - 이미 참여한 풀 등 |
| 500 | Internal Server Error - 서버 오류 |
| 503 | Service Unavailable - Chainlink 연결 실패 등 |

---

## Rate Limiting

- REST API: 100 requests/minute per IP
- WebSocket: 1000 messages/minute per connection

초과 시 HTTP 429 (Too Many Requests) 반환

---

## CORS 설정

허용된 Origins:
- `http://localhost:3000` (개발)
- `https://oxgame.xyz` (프로덕션)

---

## 인증 (선택사항)

현재는 인증이 필요 없지만, 향후 다음과 같은 방식 구현 가능:

```
Authorization: Bearer <signature>
```

지갑 서명을 통한 인증:
1. 클라이언트가 메시지에 서명
2. 서버가 서명 검증
3. JWT 토큰 발급

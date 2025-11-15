# OXGame 게임 플로우 (5초 주기)

## 게임 메커니즘

### 핵심 원리
- **5초마다 새로운 라운드 시작**
- **플레이어는 5초 안에 O/X 선택 필수**
- **선택하지 않으면 자동 탈락**
- **질문: "5초 후 가격이 올라갈까요?"**

---

## 타임라인 예시 (ETH Pool)

```
T=0s  (00:00)
├─ 현재 가격: $3,500
├─ 라운드 1 시작
├─ 질문: "5초 후 ETH 가격이 올라갈까요?"
├─ Backend → Contract.startRound(ETH, previousAnswer)
└─ 플레이어 답변 시작

T=1s  (00:01)
├─ 현재 가격: $3,501
├─ Player A: O 선택 (submitAnswer)
└─ Player B: X 선택 (submitAnswer)

T=2s  (00:02)
├─ 현재 가격: $3,502
└─ Player C: O 선택

T=3s  (00:03)
├─ 현재 가격: $3,501
└─ Player D: X 선택

T=4s  (00:04)
├─ 현재 가격: $3,500
└─ Player E: 답변 안함 → 탈락 예정

T=5s  (00:05) ⏰ 라운드 종료
├─ 종료 가격: $3,499
├─ 정답: X (하락)
├─ Player A: O → 탈락 ❌
├─ Player B: X → 생존 ✅
├─ Player C: O → 탈락 ❌
├─ Player D: X → 생존 ✅
├─ Player E: 미제출 → 탈락 ❌
└─ Contract에서 자동 탈락 처리

T=5s  (00:05) 라운드 2 시작
├─ 이전 가격: $3,499 (기준점 업데이트)
├─ 질문: "5초 후 ETH 가격이 올라갈까요?"
├─ Backend → Contract.startRound(ETH, X)
└─ 남은 플레이어: B, D만 답변 가능

T=10s (00:10) 라운드 3 시작
└─ 계속 반복...
```

---

## 백엔드 Oracle 로직 (5초 주기)

### OracleService 스케줄러

```typescript
@Injectable()
export class OracleService {
  private lastPrices: Map<ChainType, number> = new Map();

  // 5초마다 실행
  @Cron('*/5 * * * * *')
  async executeRound() {
    const pools = await this.getActivePools(); // ETH, LINK, BTC

    for (const pool of pools) {
      await this.processRound(pool.chainType);
    }
  }

  async processRound(chainType: ChainType) {
    // 1. 현재 가격 조회 (Chainlink Data Streams)
    const currentPrice = await this.chainlinkService.getLatestPrice(chainType);

    // 2. 이전 라운드 정답 계산 (5초 전 가격과 비교)
    const previousPrice = this.lastPrices.get(chainType);
    let answer: boolean | null = null;

    if (previousPrice) {
      // 가격이 올랐으면 true (O), 내렸으면 false (X)
      answer = currentPrice.price > previousPrice;

      console.log(`[${chainType}] Round Result:`, {
        previousPrice,
        currentPrice: currentPrice.price,
        change: currentPrice.price - previousPrice,
        answer: answer ? 'O (상승)' : 'X (하락)'
      });
    }

    // 3. 스마트 컨트랙트에 라운드 시작 + 이전 라운드 정답 제출
    if (answer !== null) {
      await this.blockchainService.startRound(chainType, answer);

      // 4. WebSocket으로 결과 브로드캐스트
      this.gameService.broadcastRoundResult({
        chainType,
        previousPrice,
        currentPrice: currentPrice.price,
        answer,
        roundNumber: await this.getCurrentRound(chainType)
      });
    }

    // 5. 다음 라운드를 위해 현재 가격 저장
    this.lastPrices.set(chainType, currentPrice.price);

    // 6. 새 라운드 시작 알림
    this.gameService.broadcastRoundStart({
      chainType,
      roundNumber: await this.getCurrentRound(chainType) + 1,
      basePrice: currentPrice.price,
      question: `5초 후 ${chainType} 가격이 올라갈까요?`,
      startTime: Date.now(),
      deadline: Date.now() + 5000
    });
  }
}
```

---

## 스마트 컨트랙트 수정 필요 사항

### 현재 문제점
```solidity
// 현재: Oracle이 startRound 호출 시 정답을 미리 설정
function startRound(ChainType _chainType, bool _answer) external onlyOracle {
    round.answer = _answer; // ❌ 미리 정답 노출!
}
```

### 해결 방안 1: 커밋-리빌 패턴

```solidity
// 1단계: 라운드 시작 (정답 해시만 제출)
function startRound(ChainType _chainType, bytes32 _answerHash) external onlyOracle {
    pool.currentRound++;
    round.answerHash = _answerHash; // keccak256(answer + salt)
    round.timestamp = block.timestamp;
}

// 2단계: 5초 후 정답 공개
function revealAnswer(ChainType _chainType, bool _answer, bytes32 _salt) external onlyOracle {
    require(block.timestamp >= round.timestamp + 5, "Too early");
    require(keccak256(abi.encodePacked(_answer, _salt)) == round.answerHash, "Invalid");

    // 정답과 플레이어 답변 비교하여 탈락 처리
    _processAnswers(_chainType, _answer);
}
```

### 해결 방안 2: 시간 기반 검증 (단순함, 추천)

```solidity
// Oracle이 5초마다 이전 라운드 정답 + 새 라운드 시작
function processRound(
    ChainType _chainType,
    bool _previousAnswer  // 이전 라운드 정답
) external onlyOracle {
    Pool storage pool = pools[_chainType];

    // 1. 이전 라운드가 있으면 정답 처리
    if (pool.currentRound > 0) {
        Round storage prevRound = rounds[_chainType][pool.currentRound];
        prevRound.answer = _previousAnswer;
        _eliminateWrongAnswers(_chainType, pool.currentRound, _previousAnswer);
        emit RoundEnded(_chainType, pool.currentRound, _previousAnswer);
    }

    // 2. 새 라운드 시작
    pool.currentRound++;
    pool.lastRoundTime = block.timestamp;

    Round storage newRound = rounds[_chainType][pool.currentRound];
    newRound.timestamp = block.timestamp;

    emit RoundStarted(_chainType, pool.currentRound);
}

// 5초 이내에 제출하지 않은 플레이어 탈락
function _eliminateWrongAnswers(
    ChainType _chainType,
    uint256 _roundNumber,
    bool _correctAnswer
) internal {
    Pool storage pool = pools[_chainType];
    Round storage round = rounds[_chainType][_roundNumber];

    for (uint256 i = 0; i < pool.playerAddresses.length; i++) {
        address playerAddr = pool.playerAddresses[i];
        Player storage player = pool.players[playerAddr];

        if (!player.isActive) continue;

        // 제출 안했거나 오답이면 탈락
        if (!round.hasSubmitted[playerAddr] ||
            round.submissions[playerAddr] != _correctAnswer) {
            _eliminatePlayer(_chainType, playerAddr);
        } else {
            player.correctRounds++;
        }
    }
}
```

---

## 프론트엔드 타이머 UI

### GameTimer Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

export function GameTimer({ deadline }: { deadline: number }) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, (deadline - Date.now()) / 1000);
      setTimeLeft(Math.floor(remaining));
      setProgress((remaining / 5) * 100);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>남은 시간</span>
        <span className={timeLeft <= 2 ? 'text-red-500 font-bold' : ''}>
          {timeLeft}초
        </span>
      </div>
      <Progress
        value={progress}
        className={timeLeft <= 2 ? 'bg-red-100' : ''}
      />
    </div>
  );
}
```

### GamePlay with Auto-submit

```typescript
export function GamePlay({ chainType }: { chainType: number }) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { currentRound } = useWebSocket();
  const { submitAnswer } = useContract();

  // 5초 후 자동 제출 (선택 안하면 자동 탈락)
  useEffect(() => {
    if (!currentRound || submitted) return;

    const timeout = setTimeout(async () => {
      if (selectedAnswer !== null && !submitted) {
        await handleSubmit(selectedAnswer);
      }
    }, currentRound.deadline - Date.now() - 500); // 500ms 여유

    return () => clearTimeout(timeout);
  }, [selectedAnswer, submitted, currentRound]);

  const handleSubmit = async (answer: boolean) => {
    setSubmitted(true);
    await submitAnswer(chainType, answer);
  };

  return (
    <div className="space-y-6">
      <GameTimer deadline={currentRound.deadline} />

      <div className="text-center">
        <h2 className="text-2xl font-bold">{currentRound.question}</h2>
        <p className="text-gray-600">
          현재 가격: ${currentRound.basePrice.toFixed(2)}
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <OXButton
          type="O"
          onClick={() => setSelectedAnswer(true)}
          disabled={submitted}
          selected={selectedAnswer === true}
        />
        <OXButton
          type="X"
          onClick={() => setSelectedAnswer(false)}
          disabled={submitted}
          selected={selectedAnswer === false}
        />
      </div>

      {selectedAnswer !== null && !submitted && (
        <button
          onClick={() => handleSubmit(selectedAnswer)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg"
        >
          제출하기
        </button>
      )}
    </div>
  );
}
```

---

## WebSocket 이벤트 흐름 (5초 주기)

```
T=0s: Backend → round-start
{
  chainType: "ETH",
  roundNumber: 1,
  basePrice: 3500,
  question: "5초 후 ETH 가격이 올라갈까요?",
  deadline: 1700000005000
}

T=0~5s: 실시간 가격 업데이트
Backend → price-update (100ms마다)
{
  chainType: "ETH",
  price: 3501.23,
  timestamp: 1700000001234
}

T=1s: Frontend → submitAnswer
Player A: O 선택

T=5s: Backend → round-end
{
  chainType: "ETH",
  roundNumber: 1,
  correctAnswer: false, // X (하락)
  previousPrice: 3500,
  currentPrice: 3499,
  correctPlayers: ["0xBBB", "0xDDD"],
  eliminatedPlayers: ["0xAAA", "0xCCC", "0xEEE"]
}

T=5s: Backend → round-start (즉시 다음 라운드)
{
  chainType: "ETH",
  roundNumber: 2,
  basePrice: 3499, // 업데이트됨
  question: "5초 후 ETH 가격이 올라갈까요?",
  deadline: 1700000010000
}
```

---

## 데이터베이스 스키마

```sql
-- 라운드 기록
CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  chain_type VARCHAR(10) NOT NULL,
  round_number INT NOT NULL,
  base_price DECIMAL(18, 8) NOT NULL,
  end_price DECIMAL(18, 8),
  correct_answer BOOLEAN,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  total_submissions INT DEFAULT 0,
  correct_submissions INT DEFAULT 0
);

-- 플레이어 답변
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  round_id INT REFERENCES rounds(id),
  player_address VARCHAR(42) NOT NULL,
  answer BOOLEAN NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  is_correct BOOLEAN,
  tx_hash VARCHAR(66)
);

-- 가격 데이터 (캐싱)
CREATE TABLE price_snapshots (
  id SERIAL PRIMARY KEY,
  asset VARCHAR(10) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  source VARCHAR(50) DEFAULT 'chainlink'
);

CREATE INDEX idx_price_snapshots_asset_time
ON price_snapshots(asset, timestamp DESC);
```

---

## 성능 고려사항

### 1. 트랜잭션 가스 최적화

5초마다 `processRound` 호출 → 가스비 부담

**해결책:**
- Monad는 높은 TPS와 낮은 가스비 지원
- 배치 처리: 여러 풀을 한 트랜잭션에서 처리

```solidity
function processBatchRounds(
    ChainType[] calldata _chainTypes,
    bool[] calldata _previousAnswers
) external onlyOracle {
    for (uint256 i = 0; i < _chainTypes.length; i++) {
        processRound(_chainTypes[i], _previousAnswers[i]);
    }
}
```

### 2. 동시성 처리

많은 플레이어가 동시에 `submitAnswer` 호출

**해결책:**
- Monad의 병렬 트랜잭션 처리 활용
- 프론트엔드에서 논스 관리

### 3. Oracle 신뢰성

백엔드가 다운되면 게임 중단

**해결책:**
- 백엔드 이중화
- Health check 모니터링
- 자동 재시작 스크립트

---

## 다음 단계

1. ✅ 게임 메커니즘 문서화
2. ⏳ 스마트 컨트랙트 수정 (`processRound` 함수 추가)
3. ⏳ 백엔드 5초 스케줄러 구현
4. ⏳ 프론트엔드 타이머 및 자동 제출 UI
5. ⏳ 통합 테스트

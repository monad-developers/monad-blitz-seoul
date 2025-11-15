# OXGame 시스템 아키텍처

## 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 실시간 차트  │  │  게임 UI     │  │ 지갑 연동    │          │
│  │ (TradingView)│  │  (O/X 투표)  │  │ (wagmi)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────┬──────────────────┬─────────────────┬───────────────┘
             │                  │                 │
             │ WebSocket        │ REST API        │ Web3
             │ (실시간 데이터)  │ (게임 상태)     │ (트랜잭션)
             ↓                  ↓                 ↓
┌────────────┴──────────────────┴─────────────────┴───────────────┐
│                      Backend (NestJS)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Oracle Service                          │   │
│  │  - Chainlink Data Streams 구독                           │   │
│  │  - 실시간 가격 데이터 수집 (ETH, LINK, BTC)              │   │
│  │  - O/X 문제 생성 (가격 등락 예측)                        │   │
│  │  - 스마트 컨트랙트 상호작용 (startRound)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Game Service                            │   │
│  │  - 게임 상태 관리                                        │   │
│  │  - 라운드 스케줄링                                       │   │
│  │  - 플레이어 답변 검증                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  WebSocket Gateway                        │   │
│  │  - 실시간 가격 브로드캐스트                              │   │
│  │  - 게임 이벤트 전파                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Database                              │   │
│  │  - 게임 기록                                             │   │
│  │  - 플레이어 통계                                         │   │
│  │  - 가격 데이터 캐싱                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬─────────────────────────────────────────────────────┘
             │ Web3 RPC
             ↓
┌────────────────────────────────────────────────────────────────┐
│                   Monad Testnet                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  OXGame Smart Contract                                    │  │
│  │  - 풀 관리 (ETH, LINK, BTC)                              │  │
│  │  - 플레이어 참여/탈락                                    │  │
│  │  - 상금 분배                                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## 게임 플로우

### 1. 게임 시작 및 참여

```
User → Frontend: 지갑 연결
Frontend → Smart Contract: joinPool(chainType) + 1 MON
Smart Contract: 플레이어 등록, 이벤트 발생
Backend: 이벤트 감지, DB에 플레이어 저장
Backend → Frontend (WebSocket): 플레이어 리스트 업데이트
```

### 2. 라운드 시작 (Oracle)

```
Backend Oracle Service:
  1. Chainlink Data Streams에서 실시간 가격 수신
  2. 현재 가격 기록 (예: ETH = $3,500)
  3. 5초 후 가격 예측 문제 생성
     "5초 후 이더리움 가격이 올라갈까요? O/X"
  4. Smart Contract.startRound(chainType, answer)
  5. 5초 대기 및 실제 가격 확인
  6. 정답 설정 (올랐으면 true, 내렸으면 false)

Backend → Frontend (WebSocket):
  - 라운드 시작 알림
  - 현재 가격
  - 질문 내용
  - 타이머 시작
```

### 3. 플레이어 답변

```
User → Frontend: O 또는 X 선택
Frontend → Smart Contract: submitAnswer(chainType, answer)
Smart Contract:
  - 답변 기록
  - 정답 확인
  - 오답 시 플레이어 탈락
Backend: 이벤트 감지 (PlayerEliminated)
Backend → Frontend (WebSocket): 실시간 플레이어 상태 업데이트
```

### 4. 게임 종료

```
Smart Contract:
  - 1명만 남으면 자동 종료
  - 상금 자동 분배
Backend: GameEnded 이벤트 감지
Backend → Frontend (WebSocket):
  - 승자 발표
  - 상금 정보
Frontend: 축하 애니메이션 및 통계 표시
```

## 백엔드 구조 (NestJS)

### 모듈 구성

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── chainlink/                      # Chainlink 모듈
│   │   ├── chainlink.module.ts
│   │   ├── chainlink.service.ts        # Data Streams 구독
│   │   └── dto/
│   │       └── price-data.dto.ts
│   │
│   ├── oracle/                         # Oracle 모듈
│   │   ├── oracle.module.ts
│   │   ├── oracle.service.ts           # 게임 오라클 로직
│   │   ├── oracle.scheduler.ts         # 라운드 스케줄러
│   │   └── dto/
│   │       └── round-data.dto.ts
│   │
│   ├── game/                           # 게임 모듈
│   │   ├── game.module.ts
│   │   ├── game.service.ts             # 게임 상태 관리
│   │   ├── game.controller.ts          # REST API
│   │   ├── game.gateway.ts             # WebSocket
│   │   └── entities/
│   │       ├── game.entity.ts
│   │       ├── player.entity.ts
│   │       └── round.entity.ts
│   │
│   ├── blockchain/                     # 블록체인 모듈
│   │   ├── blockchain.module.ts
│   │   ├── blockchain.service.ts       # 컨트랙트 상호작용
│   │   ├── event-listener.service.ts   # 이벤트 리스닝
│   │   └── contracts/
│   │       └── OXGame.json             # ABI
│   │
│   ├── database/                       # 데이터베이스
│   │   ├── database.module.ts
│   │   └── entities/
│   │
│   └── common/
│       ├── config/
│       │   └── config.service.ts
│       └── constants/
│           └── chain-types.ts
│
├── package.json
└── tsconfig.json
```

### 주요 서비스

#### 1. ChainlinkService (chainlink.service.ts)

```typescript
@Injectable()
export class ChainlinkService {
  // Chainlink Data Streams 구독
  async subscribeToDataStream(feedId: string) {
    // WebSocket 또는 HTTP로 Data Streams 연결
    // 실시간 가격 데이터 수신
  }

  // 특정 자산의 최신 가격 조회
  async getLatestPrice(asset: 'ETH' | 'LINK' | 'BTC'): Promise<PriceData> {
    // Data Streams에서 가격 조회
  }

  // 가격 변화 감지
  async detectPriceChange(
    startPrice: number,
    endPrice: number
  ): Promise<boolean> {
    return endPrice > startPrice; // true = 상승, false = 하락
  }
}
```

#### 2. OracleService (oracle.service.ts)

```typescript
@Injectable()
export class OracleService {
  constructor(
    private chainlinkService: ChainlinkService,
    private blockchainService: BlockchainService,
    private gameService: GameService
  ) {}

  // 라운드 시작
  async startRound(chainType: ChainType) {
    // 1. 현재 가격 조회
    const currentPrice = await this.chainlinkService.getLatestPrice(chainType);

    // 2. 라운드 데이터 생성
    const round = {
      chainType,
      startPrice: currentPrice.price,
      startTime: Date.now(),
      question: `5초 후 ${chainType} 가격이 올라갈까요?`
    };

    // 3. 5초 대기
    await this.delay(5000);

    // 4. 종료 가격 확인
    const endPrice = await this.chainlinkService.getLatestPrice(chainType);
    const answer = endPrice.price > currentPrice.price;

    // 5. 스마트 컨트랙트에 정답 전송
    await this.blockchainService.startRound(chainType, answer);

    // 6. WebSocket으로 프론트엔드에 알림
    this.gameService.broadcastRoundStart(round);

    return { round, answer };
  }

  // 자동 라운드 생성 (스케줄러)
  @Cron('*/30 * * * * *') // 30초마다
  async autoGenerateRounds() {
    const pools = await this.gameService.getActivePools();

    for (const pool of pools) {
      if (pool.playerCount >= 2) {
        await this.startRound(pool.chainType);
      }
    }
  }
}
```

#### 3. GameService (game.service.ts)

```typescript
@Injectable()
export class GameService {
  constructor(
    private websocketGateway: GameGateway,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(Player) private playerRepo: Repository<Player>
  ) {}

  // 실시간 가격 브로드캐스트
  broadcastPriceUpdate(chainType: ChainType, priceData: PriceData) {
    this.websocketGateway.server.emit('price-update', {
      chainType,
      price: priceData.price,
      timestamp: priceData.timestamp
    });
  }

  // 라운드 시작 알림
  broadcastRoundStart(round: RoundData) {
    this.websocketGateway.server.emit('round-start', round);
  }

  // 플레이어 상태 업데이트
  broadcastPlayerUpdate(poolId: string, players: Player[]) {
    this.websocketGateway.server.emit('players-update', {
      poolId,
      players
    });
  }
}
```

#### 4. BlockchainService (blockchain.service.ts)

```typescript
@Injectable()
export class BlockchainService {
  private contract: Contract;
  private wallet: Wallet;

  constructor(configService: ConfigService) {
    const provider = new JsonRpcProvider('https://testnet-rpc.monad.xyz');
    this.wallet = new Wallet(configService.get('ORACLE_PRIVATE_KEY'), provider);

    const abi = require('./contracts/OXGame.json').abi;
    this.contract = new Contract(
      configService.get('OXGAME_ADDRESS'),
      abi,
      this.wallet
    );
  }

  // 라운드 시작 (오라클만 호출 가능)
  async startRound(chainType: number, answer: boolean) {
    const tx = await this.contract.startRound(chainType, answer);
    await tx.wait();
    return tx;
  }

  // 이벤트 리스닝
  listenToEvents() {
    // PlayerJoined 이벤트
    this.contract.on('PlayerJoined', (chainType, player) => {
      this.handlePlayerJoined(chainType, player);
    });

    // PlayerEliminated 이벤트
    this.contract.on('PlayerEliminated', (chainType, player, round) => {
      this.handlePlayerEliminated(chainType, player, round);
    });

    // GameEnded 이벤트
    this.contract.on('GameEnded', (chainType, winners, prize) => {
      this.handleGameEnded(chainType, winners, prize);
    });
  }
}
```

## 프론트엔드 구조 (Next.js)

### 폴더 구조

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 홈 (게임 선택)
│   ├── game/
│   │   └── [chainType]/
│   │       └── page.tsx            # 게임 플레이 페이지
│   └── leaderboard/
│       └── page.tsx                # 리더보드
│
├── components/
│   ├── game/
│   │   ├── PriceChart.tsx          # TradingView 차트
│   │   ├── GameLobby.tsx           # 대기실
│   │   ├── GamePlay.tsx            # 게임 플레이
│   │   ├── OXButton.tsx            # O/X 투표 버튼
│   │   ├── PlayerList.tsx          # 참가자 목록
│   │   ├── Timer.tsx               # 카운트다운
│   │   └── ResultModal.tsx         # 결과 모달
│   │
│   ├── wallet/
│   │   └── ConnectWallet.tsx       # 지갑 연결
│   │
│   └── ui/                         # shadcn/ui 컴포넌트
│
├── hooks/
│   ├── useWebSocket.ts             # WebSocket 훅
│   ├── useContract.ts              # 컨트랙트 훅
│   ├── useGame.ts                  # 게임 상태 훅
│   └── usePriceChart.ts            # 차트 데이터 훅
│
├── lib/
│   ├── contracts/
│   │   ├── OXGame.json             # ABI
│   │   └── contract-config.ts      # 컨트랙트 설정
│   ├── wagmi.ts                    # wagmi 설정
│   └── websocket.ts                # WebSocket 클라이언트
│
└── types/
    ├── game.types.ts
    └── contract.types.ts
```

### 주요 컴포넌트

#### 1. PriceChart.tsx (실시간 차트)

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { useWebSocket } from '@/hooks/useWebSocket';

export function PriceChart({ chainType }: { chainType: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { priceData } = useWebSocket();

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width: 800,
      height: 400,
    });

    const lineSeries = chart.addLineSeries();

    // WebSocket에서 실시간 가격 업데이트
    if (priceData[chainType]) {
      lineSeries.update({
        time: priceData[chainType].timestamp,
        value: priceData[chainType].price
      });
    }

    return () => chart.remove();
  }, [priceData, chainType]);

  return <div ref={chartRef} className="w-full h-96" />;
}
```

#### 2. GamePlay.tsx (게임 플레이)

```typescript
'use client';

import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { useWebSocket } from '@/hooks/useWebSocket';
import { OXButton } from './OXButton';
import { Timer } from './Timer';

export function GamePlay({ chainType }: { chainType: number }) {
  const { submitAnswer } = useContract();
  const { currentRound, players } = useWebSocket();
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const handleSubmit = async (answer: boolean) => {
    setSelectedAnswer(answer);
    await submitAnswer(chainType, answer);
  };

  if (!currentRound) {
    return <div>라운드 대기 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{currentRound.question}</h2>
        <p className="text-gray-600">현재 가격: ${currentRound.startPrice}</p>
      </div>

      <Timer duration={5} onComplete={() => {}} />

      <div className="flex gap-4 justify-center">
        <OXButton
          type="O"
          onClick={() => handleSubmit(true)}
          disabled={selectedAnswer !== null}
          selected={selectedAnswer === true}
        />
        <OXButton
          type="X"
          onClick={() => handleSubmit(false)}
          disabled={selectedAnswer !== null}
          selected={selectedAnswer === false}
        />
      </div>

      <div className="mt-8">
        <h3 className="font-bold mb-4">참가자 ({players.length})</h3>
        <PlayerList players={players} />
      </div>
    </div>
  );
}
```

### WebSocket 훅

```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState<any>(null);
  const [priceData, setPriceData] = useState({});
  const [currentRound, setCurrentRound] = useState(null);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL!);
    setSocket(newSocket);

    // 가격 업데이트 구독
    newSocket.on('price-update', (data) => {
      setPriceData(prev => ({
        ...prev,
        [data.chainType]: data
      }));
    });

    // 라운드 시작 구독
    newSocket.on('round-start', (round) => {
      setCurrentRound(round);
    });

    // 플레이어 업데이트 구독
    newSocket.on('players-update', (data) => {
      setPlayers(data.players);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return { socket, priceData, currentRound, players };
}
```

## 데이터 흐름

### 실시간 가격 데이터

```
Chainlink Data Streams
  → Backend ChainlinkService (구독)
  → Backend WebSocket (브로드캐스트)
  → Frontend useWebSocket (수신)
  → PriceChart Component (차트 업데이트)
```

### 게임 플레이

```
User 클릭
  → Frontend submitAnswer()
  → Smart Contract (submitAnswer)
  → Event 발생 (SubmissionReceived / PlayerEliminated)
  → Backend EventListener (감지)
  → Backend WebSocket (브로드캐스트)
  → Frontend (플레이어 상태 업데이트)
```

## 환경 변수

### Backend (.env)

```env
# Blockchain
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
ORACLE_PRIVATE_KEY=your_oracle_private_key
OXGAME_ADDRESS=0x9EBec0d92F825E5BfF842DEf834c890d241def82

# Chainlink (Testnet Crypto Streams)
CHAINLINK_ETH_FEED_ID=...
CHAINLINK_LINK_FEED_ID=...
CHAINLINK_BTC_FEED_ID=...

# Database
DATABASE_URL=postgresql://...

# Server
PORT=3001
WS_PORT=3002
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
NEXT_PUBLIC_OXGAME_ADDRESS=0x9EBec0d92F825E5BfF842DEf834c890d241def82
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
```

## 다음 단계

1. ✅ 스마트 컨트랙트 배포 완료
2. ⏳ 백엔드 NestJS 프로젝트 설정
3. ⏳ Chainlink Data Streams 연동
4. ⏳ 프론트엔드 Next.js 프로젝트 설정
5. ⏳ WebSocket 실시간 통신 구현
6. ⏳ 통합 테스트

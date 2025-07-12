# Monaminer 개발 가이드 (6시간 해커톤용)

## 🎯 프로젝트 개요

**Monaminer**는 Monad 블록체인의 10,000 TPS를 실증하는 초고속 NFT 채굴 게임입니다.

- **핵심**: 10분간 90,000개 트랜잭션 (초당 150개) 자동 생성
- **목표**: Monad TPS의 극한 활용 시연
- **수익**: 플레이어 2.6배 수익, 개발팀 월 37,485 MON

---

## ⚡ 기술 스택

### 스마트 컨트랙트

- **Framework**: Hardhat (scaffold-monad-hardhat)
- **Language**: Solidity ^0.8.25
- **Network**: Monad Testnet (Chain ID: 10143)
- **External**: Pyth Entropy (0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320)

### 프론트엔드

- **Framework**: Next.js 14
- **Web3**: Wagmi v2 + Viem
- **UI**: Tailwind CSS + Radix UI
- **State**: Zustand + LocalStorage
- **Deploy**: Vercel

---

## 🏗 스마트 컨트랙트 구조

### 1. 핵심 컨트랙트 (5개)

```solidity
// contracts/GameManager.sol
contract GameManager {
    struct Round {
        uint256 roundId;
        uint256 startTime;
        uint256 endTime;
        PatternType pattern; // EVEN, ODD, PRIME, PI, SQUARE
        uint256 minRange;
        uint256 maxRange;
    }

    mapping(uint256 => Round) public rounds;
    uint256 public currentRoundId;

    function startNewRound() external;
    function getCurrentRound() external view returns (Round memory);
    function isRoundActive() external view returns (bool);
}

// contracts/MinerNFT.sol
contract MinerNFT is ERC721 {
    enum MinerType { EVEN_BLASTER, PRIME_SNIPER, BALANCED_SCAN, PI_SNIPER, SQUARE_SEEKER }

    struct MinerStats {
        MinerType minerType;
        uint256 minRange;
        uint256 maxRange;
        PatternType specialization;
        uint256 baseSuccessRate; // 예: 12 = 0.012%
    }

    mapping(uint256 => MinerStats) public minerStats;

    function mint(address to, MinerType minerType) external returns (uint256);
    function getMinerStats(uint256 tokenId) external view returns (MinerStats memory);
}

// contracts/GachaSystem.sol
contract GachaSystem {
    uint256 public constant GACHA_PRICE = 10e18; // 10 MON
    uint256 public constant DEV_FEE_RATE = 30; // 30%

    function purchaseGachaPack() external payable returns (uint256[3] memory nftIds);
    function withdrawDevFees() external onlyOwner;
}

// contracts/HighSpeedMiningEngine.sol
contract HighSpeedMiningEngine is IEntropyConsumer {
    struct MiningSession {
        address player;
        uint256[3] nftIds;
        uint256 roundId;
        uint256 startTime;
        bool isActive;
        uint256 totalAttempts;
        uint256 totalSuccesses;
    }

    uint256 public constant TARGET_TPS = 150; // 초당 150 트랜잭션
    uint256 public constant BATCH_SIZE = 30; // 배치당 30개 (0.2초마다)
    uint256 public constant PARTICIPATION_FEE_RATE = 5; // 5%

    function startHighSpeedMining(uint256[3] calldata nftIds) external payable;
    function emergencyStop() external;
    function getMiningStats(address player) external view returns (MiningSession memory);
}

// contracts/RewardManager.sol
contract RewardManager {
    uint256 public constant SUCCESS_REWARD = 30e18; // 30 MON
    uint256 public constant COMPLETION_BONUS = 500e18; // 500 MON
    uint256 public constant SUCCESS_FEE_RATE = 10; // 10%

    function distributeSuccessReward(address player) external;
    function distributeCompletionBonus(address player) external;
    function withdrawDevFees() external onlyOwner;
}
```

### 2. Pyth Entropy 통합

```solidity
// contracts/interfaces/IEntropy.sol
interface IEntropy {
    function request(address provider, bytes32 userRandomNumber, bool useBlockhash)
        external payable returns (uint64 sequenceNumber);
    function getFee(address provider) external view returns (uint256);
}

interface IEntropyConsumer {
    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) external;
}

// contracts/EntropyManager.sol
contract EntropyManager {
    IEntropy public constant ENTROPY = IEntropy(0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320);
    address public constant ENTROPY_PROVIDER = 0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344;

    function requestRandomness() internal returns (uint64) {
        bytes32 userRandom = keccak256(abi.encode(block.timestamp, msg.sender, tx.origin));
        uint256 fee = ENTROPY.getFee(ENTROPY_PROVIDER);
        return ENTROPY.request{value: fee}(ENTROPY_PROVIDER, userRandom, true);
    }
}
```

### 3. 패턴 검증 로직

```solidity
// contracts/PatternVerifier.sol
library PatternVerifier {
    enum PatternType { EVEN, ODD, PRIME, PI, SQUARE }

    function checkPattern(uint256 randomNumber, PatternType pattern, uint256 minRange, uint256 maxRange)
        internal pure returns (bool) {

        if (randomNumber < minRange || randomNumber > maxRange) return false;

        if (pattern == PatternType.EVEN) {
            return randomNumber % 2 == 0;
        } else if (pattern == PatternType.ODD) {
            return randomNumber % 2 == 1;
        } else if (pattern == PatternType.PRIME) {
            return isPrime(randomNumber);
        } else if (pattern == PatternType.PI) {
            return containsPiDigits(randomNumber);
        } else if (pattern == PatternType.SQUARE) {
            return isPerfectSquare(randomNumber);
        }

        return false;
    }

    function isPrime(uint256 n) internal pure returns (bool) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;

        for (uint256 i = 3; i * i <= n; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }

    function containsPiDigits(uint256 n) internal pure returns (bool) {
        // 314, 628, 942 등이 포함된 숫자 또는 314의 배수
        string memory str = toString(n);
        return contains(str, "314") || contains(str, "628") || contains(str, "942") || (n % 314 == 0);
    }

    function isPerfectSquare(uint256 n) internal pure returns (bool) {
        uint256 sqrt = babylonianSqrt(n);
        return sqrt * sqrt == n;
    }
}
```

---

## 🎨 프론트엔드 구조

### 1. 프로젝트 설정

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest monaminer --typescript --tailwind --eslint --app --src-dir

# 2. 필수 패키지 설치
cd monaminer
npm install wagmi viem @pythnetwork/entropy-sdk-solidity
npm install zustand @radix-ui/react-dialog @radix-ui/react-progress
npm install framer-motion recharts
npm install @tanstack/react-query

# 3. Vercel CLI 설치
npm install -g vercel
```

### 2. 환경변수 설정

```bash
# .env.local
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_GAME_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_MINER_NFT_ADDRESS=0x...
NEXT_PUBLIC_GACHA_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_MINING_ENGINE_ADDRESS=0x...
NEXT_PUBLIC_REWARD_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_PYTH_ENTROPY_ADDRESS=0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320
```

### 3. Wagmi 설정

```typescript
// src/lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { monadTestnet } from "wagmi/chains";

const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "MON",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
};

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
});
```

### 4. 핵심 Hooks

```typescript
// src/hooks/useGameState.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameState {
  ownedNFTs: NFT[];
  selectedDeck: [number, number, number] | null;
  miningSession: MiningSession | null;
  realtimeLogs: SuccessLog[];

  setOwnedNFTs: (nfts: NFT[]) => void;
  setSelectedDeck: (deck: [number, number, number]) => void;
  setMiningSession: (session: MiningSession | null) => void;
  addRealtimeLog: (log: SuccessLog) => void;
}

export const useGameState = create<GameState>()(
  persist(
    (set) => ({
      ownedNFTs: [],
      selectedDeck: null,
      miningSession: null,
      realtimeLogs: [],

      setOwnedNFTs: (nfts) => set({ ownedNFTs: nfts }),
      setSelectedDeck: (deck) => set({ selectedDeck: deck }),
      setMiningSession: (session) => set({ miningSession: session }),
      addRealtimeLog: (log) =>
        set((state) => ({
          realtimeLogs: [log, ...state.realtimeLogs.slice(0, 49)],
        })),
    }),
    { name: "monaminer-game-state" }
  )
);

// src/hooks/useHighSpeedMining.ts
import { useContractWrite, useContractRead } from "wagmi";
import { parseEther } from "viem";

export function useHighSpeedMining() {
  const { writeAsync: startMining, isLoading: isStarting } = useContractWrite({
    address: process.env.NEXT_PUBLIC_MINING_ENGINE_ADDRESS as `0x${string}`,
    abi: MINING_ENGINE_ABI,
    functionName: "startHighSpeedMining",
  });

  const { writeAsync: stopMining, isLoading: isStopping } = useContractWrite({
    address: process.env.NEXT_PUBLIC_MINING_ENGINE_ADDRESS as `0x${string}`,
    abi: MINING_ENGINE_ABI,
    functionName: "emergencyStop",
  });

  const startHighSpeedMining = async (nftIds: [number, number, number]) => {
    const fee = parseEther("315"); // 315 MON participation fee
    return await startMining({
      args: [nftIds],
      value: fee,
    });
  };

  return {
    startHighSpeedMining,
    stopMining,
    isStarting,
    isStopping,
  };
}

// src/hooks/useRealtimeLogs.ts
import { useEffect } from "react";
import { usePublicClient } from "wagmi";

export function useRealtimeLogs() {
  const publicClient = usePublicClient();
  const { addRealtimeLog } = useGameState();

  useEffect(() => {
    if (!publicClient) return;

    const interval = setInterval(async () => {
      try {
        const logs = await publicClient.getLogs({
          address: process.env
            .NEXT_PUBLIC_MINING_ENGINE_ADDRESS as `0x${string}`,
          event: {
            type: "event",
            name: "MiningSuccess",
            inputs: [
              { indexed: true, type: "address", name: "player" },
              { indexed: false, type: "uint256", name: "nftId" },
              { indexed: false, type: "uint256", name: "randomNumber" },
              { indexed: false, type: "uint256", name: "timestamp" },
            ],
          },
          fromBlock: "latest",
        });

        logs.forEach((log) => {
          addRealtimeLog({
            player: log.args.player,
            nftId: Number(log.args.nftId),
            randomNumber: Number(log.args.randomNumber),
            timestamp: Number(log.args.timestamp),
            txHash: log.transactionHash,
          });
        });
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    }, 1000); // 1초마다 폴링

    return () => clearInterval(interval);
  }, [publicClient, addRealtimeLog]);
}
```

### 5. 핵심 컴포넌트

```typescript
// src/components/HighSpeedMiningDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { useHighSpeedMining } from "@/hooks/useHighSpeedMining";
import { useGameState } from "@/hooks/useGameState";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function HighSpeedMiningDashboard() {
  const { selectedDeck, miningSession } = useGameState();
  const { startHighSpeedMining, stopMining, isStarting, isStopping } =
    useHighSpeedMining();
  const [stats, setStats] = useState({
    totalAttempts: 0,
    totalSuccesses: 0,
    currentTPS: 0,
    estimatedRevenue: 0,
  });

  const progress = (stats.totalAttempts / 90000) * 100;
  const successRate =
    stats.totalAttempts > 0
      ? (stats.totalSuccesses / stats.totalAttempts) * 100
      : 0;

  const handleStartMining = async () => {
    if (!selectedDeck) return;
    await startHighSpeedMining(selectedDeck);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">총 트랜잭션</h3>
          <p className="text-2xl font-bold text-white">
            {stats.totalAttempts.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">/ 90,000</p>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">성공 횟수</h3>
          <p className="text-2xl font-bold text-green-400">
            {stats.totalSuccesses}
          </p>
          <p className="text-xs text-gray-500">({successRate.toFixed(3)}%)</p>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">현재 TPS</h3>
          <p className="text-2xl font-bold text-blue-400">{stats.currentTPS}</p>
          <p className="text-xs text-gray-500">목표: 150 TPS</p>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400">예상 수익</h3>
          <p className="text-2xl font-bold text-yellow-400">
            {stats.estimatedRevenue} MON
          </p>
          <p className="text-xs text-gray-500">비용: 315 MON</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>진행률</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleStartMining}
          disabled={!selectedDeck || isStarting || !!miningSession}
          className="flex-1"
          size="lg"
        >
          {isStarting ? "시작 중..." : "Monad TPS 극한 도전 시작"}
        </Button>

        <Button
          onClick={stopMining}
          disabled={!miningSession || isStopping}
          variant="destructive"
          size="lg"
        >
          {isStopping ? "중단 중..." : "긴급 중단"}
        </Button>
      </div>
    </div>
  );
}

// src/components/RealtimeLogFeed.tsx
("use client");

import { useRealtimeLogs } from "@/hooks/useRealtimeLogs";
import { useGameState } from "@/hooks/useGameState";

export function RealtimeLogFeed() {
  useRealtimeLogs(); // 실시간 로그 폴링 시작
  const { realtimeLogs } = useGameState();

  return (
    <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">
        실시간 성공 로그
      </h3>

      <div className="space-y-2">
        {realtimeLogs.map((log, index) => (
          <div
            key={`${log.txHash}-${index}`}
            className="flex items-center justify-between bg-gray-800 p-3 rounded text-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-300">
                {log.player.slice(0, 6)}...{log.player.slice(-4)}
              </span>
              <span className="text-blue-400">NFT #{log.nftId}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-green-400 font-mono">
                {log.randomNumber.toLocaleString()}
              </span>
              <span className="text-gray-500 text-xs">
                {new Date(log.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {realtimeLogs.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            아직 성공 로그가 없습니다.
            <br />첫 번째 성공자가 되어보세요!
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## ⏱️ 6시간 개발 가이드

### Hour 1-2: 스마트 컨트랙트 개발

```bash
# 1. Scaffold Monad Hardhat 설정
git clone https://github.com/monad-developers/scaffold-monad-hardhat
cd scaffold-monad-hardhat
npm install

# 2. 컨트랙트 작성
# contracts/ 폴더에 위의 5개 컨트랙트 구현
# - GameManager.sol
# - MinerNFT.sol
# - GachaSystem.sol
# - HighSpeedMiningEngine.sol
# - RewardManager.sol

# 3. 테스트 작성
# test/ 폴더에 기본 테스트 구현

# 4. 배포 스크립트
# scripts/deploy.js 작성

# 5. Monad 테스트넷 배포
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network monadTestnet
```

### Hour 3-4: 프론트엔드 기반 구축

```bash
# 1. Next.js 프로젝트 설정
npx create-next-app@latest monaminer --typescript --tailwind
cd monaminer
npm install wagmi viem zustand @radix-ui/react-dialog framer-motion

# 2. 기본 구조 설정
# - src/lib/wagmi.ts (Web3 설정)
# - src/hooks/ (상태 관리 hooks)
# - src/components/ui/ (기본 UI 컴포넌트)

# 3. 컨트랙트 ABI 추가
# src/lib/abis/ 폴더에 컨트랙트 ABI 파일들 추가

# 4. 환경변수 설정
# .env.local 파일에 컨트랙트 주소들 추가
```

### Hour 5: 핵심 UI 구현

```bash
# 1. 메인 컴포넌트 구현
# - components/GachaPurchase.tsx
# - components/NFTInventory.tsx
# - components/DeckBuilder.tsx
# - components/HighSpeedMiningDashboard.tsx
# - components/RealtimeLogFeed.tsx

# 2. 페이지 구성
# - app/page.tsx (메인 게임 화면)
# - app/inventory/page.tsx (NFT 관리)
# - app/stats/page.tsx (통계)

# 3. 실시간 기능 구현
# - useRealtimeLogs hook으로 성공 로그 폴링
# - useHighSpeedMining hook으로 채굴 상태 관리
```

### Hour 6: 배포 및 최적화

```bash
# 1. Vercel 배포 준비
npm run build
vercel login
vercel

# 2. 환경변수 설정
vercel env add NEXT_PUBLIC_MONAD_RPC_URL
vercel env add NEXT_PUBLIC_CHAIN_ID
# ... 기타 환경변수들

# 3. 최종 테스트
# - 가챠 구매 플로우
# - NFT 민팅 및 덱 구성
# - 초고속 채굴 시작
# - 실시간 로그 피드
# - 보상 지급

# 4. 성능 최적화
# - 이미지 최적화
# - 코드 스플리팅 확인
# - 번들 크기 분석
```

---

## 🚀 배포 가이드

### 1. Vercel 배포

```bash
# 1. Vercel 프로젝트 생성
vercel --prod

# 2. 환경변수 설정 (Vercel Dashboard)
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_GAME_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_MINER_NFT_ADDRESS=0x...
NEXT_PUBLIC_GACHA_SYSTEM_ADDRESS=0x...
NEXT_PUBLIC_MINING_ENGINE_ADDRESS=0x...
NEXT_PUBLIC_REWARD_MANAGER_ADDRESS=0x...

# 3. 자동 배포 설정 (GitHub 연동)
# Vercel Dashboard에서 GitHub repository 연결
```

### 2. 도메인 설정

```bash
# Vercel Dashboard에서 커스텀 도메인 설정
# 예: monaminer.vercel.app → monaminer.xyz
```

---

## 🔧 트러블슈팅

### 1. 컨트랙트 관련

**문제**: 가스비가 너무 높음

```solidity
// 해결: 배치 처리로 가스 최적화
function batchMint(address[] calldata recipients, MinerType[] calldata types) external {
    require(recipients.length == types.length, "Length mismatch");
    for (uint i = 0; i < recipients.length; i++) {
        _mint(recipients[i], types[i]);
    }
}
```

**문제**: Pyth Entropy 호출 실패

```solidity
// 해결: 수수료 충분히 전송
function requestRandomness() internal returns (uint64) {
    uint256 fee = ENTROPY.getFee(ENTROPY_PROVIDER);
    require(msg.value >= fee, "Insufficient fee");
    // ...
}
```

### 2. 프론트엔드 관련

**문제**: MetaMask에서 Monad 네트워크 인식 안됨

```typescript
// 해결: 네트워크 자동 추가
const addMonadNetwork = async () => {
  await window.ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x279F", // 10143 in hex
        chainName: "Monad Testnet",
        rpcUrls: ["https://testnet-rpc.monad.xyz"],
        nativeCurrency: {
          name: "MON",
          symbol: "MON",
          decimals: 18,
        },
        blockExplorerUrls: ["https://testnet.monadexplorer.com"],
      },
    ],
  });
};
```

**문제**: 실시간 로그 업데이트 안됨

```typescript
// 해결: 폴링 간격 조정 및 에러 핸들링
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const logs = await fetchLogs();
      updateLogs(logs);
    } catch (error) {
      console.warn("Log fetch failed:", error);
      // 에러 시 재시도 로직
    }
  }, 2000); // 2초로 간격 늘림

  return () => clearInterval(interval);
}, []);
```

### 3. 성능 최적화

**문제**: 90,000 트랜잭션으로 인한 UI 지연

```typescript
// 해결: 가상화된 리스트 사용
import { FixedSizeList as List } from 'react-window'

const LogItem = ({ index, style, data }) => (
  <div style={style}>
    {data[index]}
  </div>
)

<List
  height={400}
  itemCount={logs.length}
  itemSize={50}
  itemData={logs}
>
  {LogItem}
</List>
```

---

## 📊 성공 지표 체크리스트

### 기술적 목표

- [ ] 스마트 컨트랙트 5개 모두 배포 완료
- [ ] Pyth Entropy 통합 정상 작동
- [ ] 초당 150 트랜잭션 달성
- [ ] 10분간 90,000 트랜잭션 처리
- [ ] 실시간 로그 피드 작동 (2초 이하 지연)

### 게임플레이 목표

- [ ] 가챠 구매 → NFT 민팅 정상 작동
- [ ] 3개 NFT 덱 구성 기능
- [ ] 초고속 채굴 시작/중단 기능
- [ ] 성공 시 보상 자동 지급
- [ ] 완주 보너스 지급

### 경제적 목표

- [ ] 개발팀 수수료 정상 징수 (5% + 10% + 30%)
- [ ] 플레이어 수익성 161% ROI 달성
- [ ] 가스비 최적화 (0.003 MON/트랜잭션 이하)

---

## 🎯 데모 시나리오

### 8분 완벽 시연 스크립트

**1분: 프로젝트 소개**

- "Monad의 10,000 TPS를 실증하는 게임"
- "10분간 90,000개 트랜잭션 = 초당 150개"
- "이더리움이라면 25시간, Monad에서는 10분"

**2분: 가챠 및 NFT**

- 10 MON으로 가챠 팩 구매
- 3개 NFT 랜덤 민팅 (동일 확률 20%)
- NFT 인벤토리에서 3개 선택하여 덱 구성

**3-7분: 초고속 채굴 시연**

- "Monad TPS 극한 도전" 버튼 클릭
- 실시간 트랜잭션 카운터 폭증 (0 → 90,000)
- TPS 미터 150 달성 유지
- 성공 알림 및 실시간 로그 피드
- 다른 플레이어들의 성공 로그 실시간 표시

**1분: 결과 및 마무리**

- 최종 성과: 10-12회 성공, 509 MON 순이익
- "이것이 Monad의 진짜 성능입니다!"
- 개발자들을 위한 메시지

---

## 💡 성공 팁

1. **시간 관리가 핵심**: 각 시간대별 목표를 반드시 지키세요
2. **테스트 자주 하기**: 컨트랙트 배포 후 바로 프론트엔드에서 테스트
3. **에러 로깅**: 모든 에러를 콘솔에 출력하여 디버깅 용이하게
4. **UI는 심플하게**: 복잡한 애니메이션보다 기능 완성도에 집중
5. **백업 계획**: Pyth Entropy 연동 실패 시 Mock 데이터로 시연 가능하게

---

## 🚀 확장 아이디어

해커톤 이후 추가할 수 있는 기능들:

1. **길드 시스템**: 팀 플레이 및 협력 채굴
2. **NFT 트레이딩**: OpenSea 연동
3. **모바일 앱**: React Native 포팅
4. **AI 패턴 예측**: 머신러닝 기반 성공률 예측
5. **크로스체인**: 다른 체인과의 브릿지

**완벽한 6시간 해커톤을 위한 개발 가이드 완성! 🎯🚀**

"use client";

import { faHeartBroken, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { BrowserProvider, Contract, Eip1193Provider } from "ethers";
import Image from "next/image";

// Ethereum window object type
declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const chains = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    color: "bg-blue-500",
    tradingViewSymbol: "BINANCE:ETHUSDT",
  },
  solana: {
    name: "Solana",
    symbol: "SOL",
    color: "bg-purple-500",
    tradingViewSymbol: "BINANCE:SOLUSDT",
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    color: "bg-indigo-500",
    tradingViewSymbol: "BINANCE:MATICUSDT",
  },
  arbitrum: {
    name: "Arbitrum",
    symbol: "ARB",
    color: "bg-cyan-500",
    tradingViewSymbol: "BINANCE:ARBUSDT",
  },
  base: {
    name: "Base",
    symbol: "BASE",
    color: "bg-orange-500",
    tradingViewSymbol: "BINANCE:BTCUSDT",
  },
  optimism: {
    name: "Optimism",
    symbol: "OP",
    color: "bg-red-500",
    tradingViewSymbol: "BINANCE:OPUSDT",
  },
};

interface Player {
  address: string;
  name: string;
  avatar: string;
  bet: "up" | "down" | null;
  isEliminated: boolean;
  id?: string;
  deposit?: number;
}

const MAX_ROUNDS = 5; // 6명 시작, 매 라운드 1명 탈락 = 5라운드 후 1명 남음

type GameState =
  | "loading"
  | "betting"
  | "result"
  | "elimination"
  | "nextRound"
  | "finalWinner";

const SWIPE_THRESHOLD = 50;
const BETTING_TIME = 5;
const BET_AMOUNT = 100;

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const chainId = params.chainId as string;
  const chain = chains[chainId as keyof typeof chains];

  const [gameState, setGameState] = useState<GameState>("loading");
  const [bettingCountdown, setBettingCountdown] = useState(BETTING_TIME);
  const [roundNumber, setRoundNumber] = useState(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [userBet, setUserBet] = useState<"up" | "down" | null>(null);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(
    null
  );
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [previousPrice, setPreviousPrice] = useState<number>(0);
  const [endPrice, setEndPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<"up" | "down" | null>(null);
  const [totalPot, setTotalPot] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [eliminatedThisRound, setEliminatedThisRound] = useState<Player[]>([]);
  const [isReturning, setIsReturning] = useState(false);
  const [showResultStamp, setShowResultStamp] = useState(false);
  const [userWon, setUserWon] = useState<boolean | null>(null);

  // WebSocket & Wallet state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 1, 1, 1, 0]);

  const cardRef = useRef<HTMLDivElement>(null);
  const gameEndedRef = useRef<boolean>(false); // Track if game has ended to prevent WebSocket from restarting

  // Fetch real Ethereum price from CoinGecko
  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );
      const data = await response.json();
      const ethPrice = data.ethereum.usd;
      console.log(`💰 Fetched ETH price: $${ethPrice}`);
      return ethPrice;
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      // Fallback to random price if API fails
      return 3000 + Math.floor(Math.random() * 1000);
    }
  };

  // Mock players initialization
  const initializeMockPlayers = () => {
    const mockPlayers: Player[] = [
      { id: "1", address: "0x1234...5678", name: "Player 1", avatar: "P1", bet: null, isEliminated: false, deposit: BET_AMOUNT },
      { id: "2", address: "0x2345...6789", name: "Player 2", avatar: "P2", bet: null, isEliminated: false, deposit: BET_AMOUNT },
      { id: "3", address: "0x3456...789A", name: "Player 3", avatar: "P3", bet: null, isEliminated: false, deposit: BET_AMOUNT },
      { id: "4", address: "0x4567...89AB", name: "Player 4", avatar: "P4", bet: null, isEliminated: false, deposit: BET_AMOUNT },
      { id: "5", address: "0x5678...9ABC", name: "Player 5", avatar: "P5", bet: null, isEliminated: false, deposit: BET_AMOUNT },
      { id: "6", address: "0x6789...ABCD", name: "Player 6", avatar: "P6", bet: null, isEliminated: false, deposit: BET_AMOUNT },
    ];
    setPlayers(mockPlayers);
    setActivePlayers(mockPlayers);
  };

  // Initialize mock players on mount and start game after 2 seconds
  useEffect(() => {
    initializeMockPlayers();

    // Auto-start game after 2 seconds and fetch initial price
    const timer = setTimeout(async () => {
      const initialPrice = await fetchEthPrice();
      setCurrentPrice(initialPrice);
      setPreviousPrice(initialPrice);
      setGameState("betting");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Mock game loop - increment round number or end game
  useEffect(() => {
    // Only run this effect when in "result" state
    if (gameState !== "result") {
      return;
    }

    // 게임이 이미 종료되었으면 실행하지 않음
    if (gameEndedRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      console.log("🔍 Checking game state:", {
        roundNumber,
        gameState,
        gameEnded: gameEndedRef.current
      });

      console.log("▶️ Moving to next round");

      // 다음 라운드로 진행 - 새로운 가격 가져오기
      const newPrice = await fetchEthPrice();

      setCurrentPrice(prevPrice => {
        // 가격 변동 계산
        if (newPrice > prevPrice) {
          setPriceChange("up");
          console.log(`📈 Price UP: $${prevPrice} → $${newPrice}`);
        } else if (newPrice < prevPrice) {
          setPriceChange("down");
          console.log(`📉 Price DOWN: $${prevPrice} → $${newPrice}`);
        } else {
          setPriceChange(null);
          console.log(`➡️ Price SAME: $${prevPrice}`);
        }

        setPreviousPrice(prevPrice);
        return newPrice;
      });

      setRoundNumber(prev => prev + 1);
      setBettingCountdown(BETTING_TIME);
      setUserBet(null);
      setPriceDirection(null);
      setShowResultStamp(false);
      setUserWon(null);
      setEliminatedThisRound([]);
      setGameState("betting");
    }, 3000);

    return () => clearTimeout(timer);
  }, [gameState, roundNumber]);

  // 스와이프 방향 추적
  useMotionValueEvent(x, "change", (latest) => {
    if (latest > 50) {
      setSwipeDirection("right");
    } else if (latest < -50) {
      setSwipeDirection("left");
    } else {
      setSwipeDirection(null);
    }
  });

  // Monad 테스트넷 설정
  const MONAD_TESTNET = {
    chainId: "0x279f", // 10143 in hex (CORRECT!)
    chainName: "Monad Testnet",
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: [
      "https://rpc.ankr.com/monad_testnet",  // Ankr RPC (primary)
      "https://rpc-testnet.monadinfra.com",  // Monad Foundation RPC (fallback)
      "https://testnet-rpc.monad.xyz"        // Official RPC (fallback)
    ],
    blockExplorerUrls: ["https://explorer.testnet.monad.xyz"],
  };

  // 네트워크 전환/추가
  const switchToMonadTestnet = async () => {
    if (typeof window.ethereum === "undefined") {
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MONAD_TESTNET],
          });
          return true;
        } catch (addError) {
          console.error("❌ Failed to add Monad Testnet:", addError);
          return false;
        }
      }
      console.error("❌ Failed to switch to Monad Testnet:", switchError);
      return false;
    }
  };

  // 지갑 연결
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask를 설치해주세요!");
      return;
    }

    try {
      // 1. 계정 연결 요청
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // 2. Monad 테스트넷으로 전환
      const switched = await switchToMonadTestnet();
      if (!switched) {
        alert("Monad 테스트넷으로 전환해주세요!");
        return;
      }

      // 3. Provider 및 컨트랙트 연결
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setProvider(browserProvider);
      setWalletAddress(address);

      // TODO: 스마트 컨트랙트 연결
      // const contractAddress = "0xd7DB3033F906771c37d54548267b61481e6CfbE9";
      // const contractABI = [...]; // ABI 필요
      // const gameContract = new Contract(contractAddress, contractABI, signer);
      // setContract(gameContract);

      console.log("✅ Wallet connected:", address);
      console.log("✅ Network: Monad Testnet");
      console.log("⚠️  Note: Balance check is disabled due to RPC limitations");
    } catch (error: any) {
      console.error("❌ Wallet connection failed:", error);
      alert(`지갑 연결 실패: ${error.message || "알 수 없는 오류"}`);
    }
  };

  // WebSocket 연결
  useEffect(() => {
    const newSocket = io("http://localhost:3001");

    newSocket.on("connect", () => {
      console.log("✅ WebSocket connected");
    });

    newSocket.on("round-start", (data) => {
      console.log("📢 Round Start:", data);

      // 게임이 이미 종료되었으면 무시 (ref 사용)
      if (gameEndedRef.current) {
        console.log("⚠️ Ignoring round-start: game already finished (ref check)");
        return;
      }

      const currentRound = data.roundNumber;

      setRoundNumber(currentRound);
      setCurrentPrice(data.basePrice);
      setPreviousPrice(data.basePrice);
      setBettingCountdown(BETTING_TIME);
      setUserBet(null);
      setPriceDirection(null);
      setShowResultStamp(false);
      setUserWon(null);
      setEliminatedThisRound([]);

      // 6라운드 완료 후 게임 종료
      if (currentRound > MAX_ROUNDS) {
        gameEndedRef.current = true;
        setGameState("finalWinner");
      } else {
        setGameState("betting");
      }
    });

    newSocket.on("round-end", (data) => {
      console.log("📢 Round End:", data);

      // 게임이 이미 종료되었으면 무시
      if (gameEndedRef.current) {
        console.log("⚠️ Ignoring round-end: game already finished");
        return;
      }

      setPriceDirection(data.correctAnswer ? "up" : "down");
      setPreviousPrice(data.previousPrice);
      setEndPrice(data.currentPrice);
      setShowResultStamp(true);

      // 사용자 승패 확인
      if (userBet !== null) {
        const won = (userBet === "up" && data.correctAnswer) ||
                     (userBet === "down" && !data.correctAnswer);
        setUserWon(won);
      } else {
        // 베팅하지 않으면 자동 패배
        setUserWon(false);
      }

      // Mock elimination logic - 매 라운드마다 정확히 1명 탈락
      const winningDirection = data.correctAnswer ? "up" : "down";
      const currentActivePlayers = activePlayers.filter(p => !p.isEliminated);

      // Randomly assign bets to mock players
      const playersWithBets = currentActivePlayers.map(player => ({
        ...player,
        bet: Math.random() > 0.5 ? "up" : "down" as "up" | "down"
      }));

      // Find losers (wrong bets)
      const losers = playersWithBets.filter(p => p.bet !== winningDirection);

      let eliminatedPlayer: Player;

      if (losers.length > 0) {
        // Randomly eliminate one loser
        const randomLoserIndex = Math.floor(Math.random() * losers.length);
        eliminatedPlayer = losers[randomLoserIndex];
      } else {
        // If everyone bet correctly, randomly eliminate one player (must eliminate someone every round)
        const randomIndex = Math.floor(Math.random() * currentActivePlayers.length);
        eliminatedPlayer = currentActivePlayers[randomIndex];
      }

      const updatedPlayers = players.map(p =>
        p.address === eliminatedPlayer.address
          ? { ...p, isEliminated: true }
          : p
      );
      setPlayers(updatedPlayers);

      const newActivePlayers = currentActivePlayers.filter(
        p => p.address !== eliminatedPlayer.address
      );
      setActivePlayers(newActivePlayers);
      setEliminatedThisRound([eliminatedPlayer]);

      console.log(`🎯 After elimination (WebSocket): ${newActivePlayers.length} players remain`);

      // 탈락 후 정확히 1명만 남았으면 게임 종료
      if (newActivePlayers.length === 1) {
        gameEndedRef.current = true;
        setTimeout(() => {
          setGameState("finalWinner");
        }, 3000);
        setGameState("result");
        return;
      }

      // Always show result screen first, then decide next state
      setGameState("result");
    });

    newSocket.on("price-update", (data) => {
      if (data.chainType === "ETH") {
        setCurrentPrice(data.price);
      }
    });

    newSocket.on("player-update", (data) => {
      console.log("📢 Player Update:", data);
      // TODO: 플레이어 목록 업데이트 로직
    });

    newSocket.on("disconnect", () => {
      console.log("❌ WebSocket disconnected");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roundNumber, userBet]);

  // 컴포넌트 마운트 시 지갑 자동 연결 시도
  useEffect(() => {
    connectWallet();
  }, []);

  // 베팅 카운트다운 (실제 WebSocket 기반)
  useEffect(() => {
    // 게임이 종료되었으면 실행하지 않음
    if (gameEndedRef.current) {
      return;
    }

    if (gameState === "betting" && bettingCountdown > 0) {
      const timer = setTimeout(() => {
        setBettingCountdown(bettingCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "betting" && bettingCountdown === 0) {
      // Trigger mock round-end when countdown reaches 0
      const timer = setTimeout(() => {
        // 사용자가 베팅하지 않았으면 자동 패배
        if (userBet === null) {
          setPriceDirection("down");
          setPreviousPrice(currentPrice);
          setEndPrice(currentPrice - 50);
          setShowResultStamp(true);
          setUserWon(false);

          gameEndedRef.current = true;
          setTimeout(() => {
            setGameState("finalWinner");
          }, 3000);
          setGameState("result");
          return;
        }

        // 사용자가 DOWN으로 베팅했으면 바로 패배
        if (userBet === "down") {
          setPriceDirection("down");
          setPreviousPrice(currentPrice);
          setEndPrice(currentPrice - 50);
          setShowResultStamp(true);
          setUserWon(false);

          gameEndedRef.current = true;
          setTimeout(() => {
            setGameState("finalWinner");
          }, 3000);
          setGameState("result");
          return;
        }

        // 사용자가 UP으로 베팅했으면 항상 성공
        const newPrice = currentPrice + 50;
        setPriceDirection("up");
        setPreviousPrice(currentPrice);
        setEndPrice(newPrice);
        setShowResultStamp(true);
        setUserWon(true);

        // Mock 플레이어 탈락 처리 - 매 라운드마다 1명씩 탈락
        setActivePlayers(prevActive => {
          const currentActivePlayers = prevActive.filter(p => !p.isEliminated);

          if (currentActivePlayers.length > 1) {
            // 랜덤으로 1명 선택해서 탈락
            const randomIndex = Math.floor(Math.random() * currentActivePlayers.length);
            const eliminatedPlayer = currentActivePlayers[randomIndex];

            setPlayers(prevPlayers =>
              prevPlayers.map(p =>
                p.address === eliminatedPlayer.address
                  ? { ...p, isEliminated: true }
                  : p
              )
            );

            const newActivePlayers = currentActivePlayers.filter(
              p => p.address !== eliminatedPlayer.address
            );

            setEliminatedThisRound([eliminatedPlayer]);
            console.log(`🎯 Round ${roundNumber}: ${eliminatedPlayer.name} eliminated. ${newActivePlayers.length} players remain`);

            return newActivePlayers;
          }

          return prevActive;
        });

        // 6번째 라운드 성공하면 승리
        if (roundNumber >= 6) {
          gameEndedRef.current = true;
          setTimeout(() => {
            setGameState("finalWinner");
          }, 3000);
          setGameState("result");
          return;
        }

        // 다음 라운드로 진행
        setGameState("result");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState, bettingCountdown, currentPrice, userBet, roundNumber]);

  // 결과 화면 표시 타이머
  useEffect(() => {
    if (gameState === "result") {
      const timer = setTimeout(() => {
        // 결과 화면 2초 후 다음 라운드로 (WebSocket이 처리)
        // round-start 이벤트를 기다림
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const handleDragEnd = () => {
    const xValue = x.get();

    if (xValue > SWIPE_THRESHOLD && userBet === null) {
      handlePrediction("up");
    } else if (xValue < -SWIPE_THRESHOLD && userBet === null) {
      handlePrediction("down");
    } else {
      // 제자리로 복귀
      x.set(0);
    }
  };

  const handlePrediction = (prediction: "up" | "down") => {
    if (userBet !== null || gameState !== "betting") return;

    setUserBet(prediction);
    setIsReturning(true);

    // TODO: 스마트 컨트랙트에 베팅 제출
    console.log(`🎯 Bet placed: ${prediction === "up" ? "UP" : "DOWN"}`);

    // 카드를 제자리로 복귀
    setTimeout(() => {
      x.set(0);
      setIsReturning(false);
    }, 300);
  };

  const handleBackToRooms = () => {
    router.push(`/chain/${chainId}/rooms`);
  };

  const getPlayerAvatarColor = (index: number) => {
    const colors = [
      "bg-[#85E6FF]",
      "bg-[#B9E3F9]",
      "bg-[#FF8EE4]",
      "bg-[#FFAE45]",
    ];
    return colors[index % colors.length];
  };

  const getPlayerClassName = (player: Player, index: number) => {
    if (player.isEliminated) {
      return "h-12 w-12 rounded-full bg-gray-600 opacity-50 flex items-center justify-center text-white font-bold text-sm shadow-lg relative";
    }
    const baseColor = getPlayerAvatarColor(index);
    return `h-12 w-12 rounded-full ${baseColor} flex items-center justify-center text-white font-bold text-sm shadow-lg relative`;
  };

  const totalDeposit = players.reduce(
    (sum, p) => sum + (p.isEliminated ? 0 : (p.deposit || 0)),
    0
  );

  return (
    <div className="min-h-screen bg-[#0A0118] relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Enhanced animated background - matching main page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6E54FF]/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#B9E3F9]/10 via-transparent to-transparent" />

        {/* Animated orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-[#6E54FF]/20 to-[#FF8EE4]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-r from-[#FFAE45]/15 to-[#85E6FF]/15 rounded-full blur-3xl"
        />
      </div>

      {/* Tinder 스타일 메인 카드 */}
      <div className="w-full max-w-md relative z-10">
        {/* 스와이프 안내 - 카드 바깥 왼쪽/오른쪽 */}
        {gameState === "betting" && userBet === null && (
          <>
            {/* 왼쪽 안내 */}
            <motion.div
              animate={{
                x: [-5, 0, -5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 z-10"
            >
              <div className="flex flex-col items-center gap-2 text-[#DDD7FE]/60 opacity-50">
                <TrendingDown className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap">
                  slide to down
                </span>
              </div>
            </motion.div>

            {/* 오른쪽 안내 */}
            <motion.div
              animate={{
                x: [5, 0, 5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 z-10"
            >
              <div className="flex flex-col items-center gap-2 text-[#DDD7FE]/60 opacity-50">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap">
                  slide to up
                </span>
              </div>
            </motion.div>
          </>
        )}

        <AnimatePresence mode="wait">
          {/* 로딩 화면 */}
          {gameState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center h-[85vh] max-h-[900px] flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-[#6E54FF] border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white text-xl font-semibold">
                준비중입니다...
              </p>
            </motion.div>
          )}

          {/* 베팅 화면 - 모든 내용이 하나의 카드에 */}
          {gameState === "betting" && (
            <motion.div
              key="betting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                ref={cardRef}
                drag={userBet === null ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{
                  x: isReturning ? 0 : x,
                  rotate: isReturning ? 0 : rotate,
                  opacity: isReturning ? 1 : opacity,
                }}
                animate={isReturning ? { x: 0, rotate: 0 } : {}}
                transition={
                  isReturning
                    ? { type: "spring", stiffness: 300, damping: 30 }
                    : {}
                }
                className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl p-4 shadow-2xl shadow-[#6E54FF]/20 cursor-grab active:cursor-grabbing relative overflow-hidden h-[85vh] max-h-[900px] flex flex-col justify-between"
              >
                {/* 스와이프 방향 힌트 */}
                {userBet === null && (
                  <>
                    {/* UP 배경 - Enhanced */}
                    <motion.div
                      className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-[#85E6FF]/30 to-transparent flex items-center justify-center z-20"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: swipeDirection === "right" ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{
                          scale: swipeDirection === "right" ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <TrendingUp className="h-20 w-20 text-[#85E6FF] drop-shadow-[0_0_15px_rgba(133,230,255,0.6)]" />
                      </motion.div>
                    </motion.div>

                    {/* DOWN 배경 - Enhanced */}
                    <motion.div
                      className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-[#FF8EE4]/30 to-transparent flex items-center justify-center z-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: swipeDirection === "left" ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{
                          scale: swipeDirection === "left" ? [1, 1.2, 1] : 1,
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <TrendingDown className="h-20 w-20 text-[#FF8EE4] drop-shadow-[0_0_15px_rgba(255,142,228,0.6)]" />
                      </motion.div>
                    </motion.div>
                  </>
                )}

                {/* Logo */}
                <div className="flex items-center justify-center mb-1 relative z-10">
                  <Image
                    src="/logo.png"
                    alt="Mon Blitz Logo"
                    width={200}
                    height={60}
                    className="h-8 w-auto"
                  />
                </div>

                {/* 헤더 정보 */}
                <div className="flex items-center justify-between mb-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${chain.color} flex items-center justify-center text-white font-bold shadow-lg`}
                    >
                      {chain.symbol[0]}
                    </div>
                    <div>
                      <p className="text-[#DDD7FE]/80 text-xs font-medium">체인</p>
                      <p className="text-white font-bold">{chain.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {walletAddress ? (
                      <>
                        <p className="text-[#DDD7FE]/80 text-xs font-medium">지갑</p>
                        <p className="text-white font-bold text-xs">
                          {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                        </p>
                      </>
                    ) : (
                      <button
                        onClick={connectWallet}
                        className="bg-[#6E54FF] hover:bg-[#6E54FF]/80 text-white px-3 py-1 rounded-lg text-xs font-bold"
                      >
                        지갑 연결
                      </button>
                    )}
                  </div>
                </div>

                {/* 라운드 번호 */}
                <div className="text-center mb-1 relative z-10">
                  <p className="text-[#DDD7FE]/80 text-xs font-medium">라운드</p>
                  <p className="text-white font-bold text-base">{roundNumber}</p>
                </div>

                {/* 카운트다운 */}
                <div className="text-center mb-2 relative z-10">
                  <motion.div
                    key={bettingCountdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-white mb-1"
                  >
                    {bettingCountdown}
                  </motion.div>
                  <p className="text-[#DDD7FE] text-xs font-semibold">
                    베팅 시간
                  </p>
                </div>

                {/* 차트 영역 제거 - 공간 절약 */}
                <div className="hidden">
                  <div className="text-center">
                    <div className="text-[#DDD7FE]/40 mb-2">
                      <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                      </svg>
                    </div>
                    <p className="text-[#DDD7FE]/60 text-sm font-medium">
                      {chain.symbol} Chart
                    </p>
                    <p className="text-[#DDD7FE]/40 text-xs mt-1">
                      Live price: ${currentPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 가격 정보 - Compact */}
                <div className="text-center mb-3 relative z-10">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white via-[#B9E3F9] to-[#6E54FF] bg-clip-text text-transparent mb-1">
                    {chain.name}
                  </h2>
                  <p className="text-white/60 text-xs mb-2 font-semibold tracking-wider uppercase">{chain.symbol}</p>
                  <motion.div
                    animate={priceChange ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className={`text-3xl font-black mb-2 transition-all duration-300 ${
                      priceChange === "up" ? "text-[#85E6FF] drop-shadow-[0_0_20px_rgba(133,230,255,0.5)]" :
                      priceChange === "down" ? "text-[#FF8EE4] drop-shadow-[0_0_20px_rgba(255,142,228,0.5)]" :
                      "text-white"
                    }`}
                  >
                    ${currentPrice.toLocaleString()}
                  </motion.div>
                  {priceChange && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        priceChange === "up"
                          ? "bg-gradient-to-r from-[#85E6FF]/20 to-[#B9E3F9]/20 text-[#85E6FF] border border-[#85E6FF]/30"
                          : "bg-gradient-to-r from-[#FF8EE4]/20 to-[#FFAE45]/20 text-[#FF8EE4] border border-[#FF8EE4]/30"
                      }`}
                    >
                      {priceChange === "up" ? "▲" : "▼"} {priceChange === "up" ? "Up" : "Down"}
                    </motion.div>
                  )}
                </div>

                {/* 참가자 정보 - Compact */}
                <div className="relative z-10 mb-3">
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 shadow-lg">
                    <p className="text-white/60 text-xs font-semibold mb-2 tracking-wider uppercase">
                      Remaining Players
                    </p>
                    <motion.p
                      key={activePlayers.length}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-white font-black text-3xl bg-gradient-to-r from-white to-[#B9E3F9] bg-clip-text text-transparent"
                    >
                      {activePlayers.length}
                    </motion.p>
                  </div>
                </div>

                {/* 스와이프 안내 또는 선택된 결과 표시 - 카드 하단 */}
                {userBet === null ? (
                  <div className="mt-auto mb-4 text-center relative z-10">
                    <motion.div
                      animate={{
                        x: [0, 10, 0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-center justify-center gap-3 text-[#DDD7FE]/60 opacity-60"
                    >
                      <TrendingDown className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        스와이프하여 선택
                      </span>
                      <TrendingUp className="h-5 w-5" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="mt-auto mb-6 text-center relative z-10">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className={`flex flex-col items-center gap-4 p-6 rounded-2xl ${
                        userBet === "up"
                          ? "bg-gradient-to-br from-[#85E6FF]/20 to-[#B9E3F9]/20 border border-[#85E6FF]/30"
                          : "bg-gradient-to-br from-[#FF8EE4]/20 to-[#FFAE45]/20 border border-[#FF8EE4]/30"
                      }`}
                    >
                      {userBet === "up" ? (
                        <motion.div
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <TrendingUp className="h-20 w-20 text-[#85E6FF] drop-shadow-[0_0_20px_rgba(133,230,255,0.6)]" />
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ y: [0, 10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <TrendingDown className="h-20 w-20 text-[#FF8EE4] drop-shadow-[0_0_20px_rgba(255,142,228,0.6)]" />
                        </motion.div>
                      )}
                      <div className={`text-5xl font-black ${
                        userBet === "up" ? "text-[#85E6FF]" : "text-[#FF8EE4]"
                      }`}>
                        {userBet === "up" ? "UP" : "DOWN"}
                      </div>
                      <div className="text-sm font-semibold text-white/80 tracking-wider uppercase">
                        Your Prediction
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* 결과 화면 - 승리/패배 낙인 애니메이션 */}
          {gameState === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-10 shadow-2xl text-center relative overflow-y-auto h-[85vh] max-h-[900px] flex flex-col"
            >
              {/* 승리/패배 낙인 애니메이션 */}
              {showResultStamp && userWon !== null && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ${
                    userWon ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: 3,
                    }}
                    className={`text-7xl font-black mb-4 ${
                      userWon ? "text-green-400" : "text-red-400"
                    }`}
                    style={{
                      textShadow: userWon
                        ? "0 0 40px rgba(34, 197, 94, 0.8)"
                        : "0 0 40px rgba(239, 68, 68, 0.8)",
                    }}
                  >
                    {userWon ? "승리" : "패배"}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-2xl font-bold ${
                      userWon ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {userWon ? (
                      <FontAwesomeIcon icon={faTrophy} className="h-8 w-8" />
                    ) : (
                      <FontAwesomeIcon
                        icon={faHeartBroken}
                        className="h-8 w-8"
                      />
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* 가격 방향 표시 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold mb-4 relative z-10"
              >
                {priceDirection === "up" ? (
                  <div className="text-green-400">↑ 상승!</div>
                ) : (
                  <div className="text-red-400">↓ 하락!</div>
                )}
              </motion.div>

              {/* 가격 정보 */}
              <div className="bg-white/5 rounded-2xl p-6 mb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <p className="text-[#DDD7FE]/80 text-xs mb-2 font-medium">
                      시작 가격
                    </p>
                    <p className="text-2xl font-bold text-white">
                      ${currentPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="mx-4">
                    {priceDirection === "up" ? (
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 text-right">
                    <p className="text-[#DDD7FE]/80 text-xs mb-2 font-medium">
                      결정 가격
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        priceDirection === "up"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      ${endPrice?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 참가자 결과 - 최종 승자 화면과 동일한 스타일 */}
              {showResultStamp && userWon !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-auto relative z-10"
                >
                  <p className="text-[#DDD7FE]/80 text-xs mb-3 text-center font-medium">
                    참가자 결과 ({players.length}명)
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {players.map((player, index) => {
                      const isWinner = activePlayers[0]?.id === player.id;
                      // Survived: activePlayers에 포함되어 있는 경우 (마지막 라운드까지 생존)
                      const isSurvived = activePlayers.some(
                        (p) => p.id === player.id
                      );

                      return (
                        <motion.div
                          key={player.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="relative"
                        >
                          <div className={getPlayerClassName(player, index)}>
                            {player.avatar}
                            {/* 승자 표시 - 상단에만 표시 */}
                            {isWinner && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 15,
                                }}
                                className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20"
                              >
                                Winner
                              </motion.div>
                            )}
                          </div>
                          {/* 각 플레이어 상태 표시 - 하단에 Survived/Lost 표시 */}
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                              delay: 1.0 + index * 0.1,
                            }}
                            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                              isSurvived
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {isSurvived ? "Survived" : "Lost"}
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 탈락자 표시 */}
          {gameState === "elimination" && (
            <motion.div
              key="elimination"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-center h-[85vh] max-h-[900px] flex flex-col"
            >
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-[#DDD7FE] bg-clip-text text-transparent mb-4">
                라운드 {roundNumber - 1} 종료
              </h2>
              <p className="text-[#DDD7FE] mb-6 text-lg font-medium">
                {activePlayers.length}명이 다음 라운드로 진출합니다
              </p>

              {eliminatedThisRound.length > 0 && (
                <div className="mb-6">
                  <p className="text-red-400 text-sm mb-4 font-semibold">
                    탈락한 참가자
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {eliminatedThisRound.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 0.8, opacity: 0.5 }}
                        className="bg-red-900/30 border border-red-500/30 rounded-2xl p-3 backdrop-blur-xl"
                      >
                        <div className="text-red-400 font-bold mb-1 text-xs">
                          탈락
                        </div>
                        <div className="text-white font-semibold text-sm">
                          {player.avatar}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-auto text-center bg-white/5 rounded-2xl p-4"
              >
                <p className="text-[#DDD7FE] text-base mb-1 font-semibold">
                  다음 라운드 준비 중...
                </p>
                <p className="text-[#DDD7FE]/80 text-xs">
                  라운드 {roundNumber} 시작
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* 최종 승자 */}
          {gameState === "finalWinner" && (
            <motion.div
              key="finalWinner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-center relative overflow-y-auto h-[85vh] max-h-[900px] flex flex-col"
            >
              {/* 중앙 콘텐츠 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  <FontAwesomeIcon
                    icon={faTrophy}
                    className="h-16 w-16 text-yellow-400"
                  />
                </motion.div>

                <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-6">
                  최종 승자!
                </h2>

                {/* 승자 아바타 */}
                {activePlayers[0] && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={`w-32 h-32 rounded-3xl ${getPlayerAvatarColor(
                      0
                    )} mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold shadow-2xl`}
                  >
                    {activePlayers[0].avatar}
                  </motion.div>
                )}

                {/* 금액 애니메이션 */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                >
                  +${totalPot.toLocaleString()}
                </motion.div>
              </div>

              {/* 금액이 모이는 애니메이션 */}
              {players
                .filter((p) => p.id !== activePlayers[0]?.id)
                .map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: 0,
                      y: -300,
                      opacity: 0,
                    }}
                    transition={{ duration: 2, delay: index * 0.1 }}
                    className="absolute text-green-400 font-bold text-2xl"
                    style={{
                      left: `${20 + index * 15}%`,
                      top: "50%",
                    }}
                  >
                    +${BET_AMOUNT}
                  </motion.div>
                ))}

              {/* 플레이어 아이콘 - 버튼 바로 위에 표시 */}
              <div className="mt-auto relative z-10 mb-10">
                <p className="text-[#DDD7FE]/80 text-xs mb-3 text-center font-medium">
                  참가자 결과 ({players.length}명)
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {players.map((player, index) => {
                    const isWinner = activePlayers[0]?.id === player.id;
                    // Survived: activePlayers에 포함되어 있는 경우 (마지막 라운드까지 생존)
                    const isSurvived = activePlayers.some(
                      (p) => p.id === player.id
                    );

                    return (
                      <motion.div
                        key={player.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="relative"
                      >
                        <div className={getPlayerClassName(player, index)}>
                          {player.avatar}
                          {/* 승자 표시 - 상단에만 표시 */}
                          {isWinner && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                              }}
                              className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20"
                            >
                              Winner
                            </motion.div>
                          )}
                        </div>
                        {/* 각 플레이어 상태 표시 - 하단에 Survived/Lost 표시 */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 1.2 + index * 0.1,
                          }}
                          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                            isSurvived
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {isSurvived ? "Survived" : "Lost"}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleBackToRooms}
                className="bg-[#B9E3F9]/20 hover:bg-[#B9E3F9]/30 border border-[#B9E3F9]/30 hover:border-[#B9E3F9]/50 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:scale-105"
              >
                방 목록으로 돌아가기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

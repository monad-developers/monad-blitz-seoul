"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
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

const chains = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "from-[#627EEA] to-[#8A9FED]",
    gradient: "from-[#627EEA]/20 to-[#8A9FED]/20",
    description: "The world's leading smart contract platform",
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    color: "from-[#9945FF] to-[#14F195]",
    gradient: "from-[#9945FF]/20 to-[#14F195]/20",
    description: "High-performance blockchain network",
    logoUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    color: "from-[#8247E5] to-[#A573F2]",
    gradient: "from-[#8247E5]/20 to-[#A573F2]/20",
    description: "Ethereum's leading Layer 2 solution",
    logoUrl: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    color: "from-[#28A0F0] to-[#4FB3F6]",
    gradient: "from-[#28A0F0]/20 to-[#4FB3F6]/20",
    description: "Ethereum Layer 2 optimistic rollup",
    logoUrl: "https://assets.coingecko.com/coins/images/16547/small/arbitrum.png",
  },
  {
    id: "base",
    name: "Base",
    symbol: "BASE",
    color: "from-[#0052FF] to-[#3D7FFF]",
    gradient: "from-[#0052FF]/20 to-[#3D7FFF]/20",
    description: "Coinbase's Layer 2 network",
    logoUrl: "https://assets.coingecko.com/coins/images/27277/small/base.png",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    color: "from-[#FF0420] to-[#FF4D6A]",
    gradient: "from-[#FF0420]/20 to-[#FF4D6A]/20",
    description: "Ethereum Layer 2 optimistic rollup",
    logoUrl: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function ChainSelection() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

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
      // 먼저 네트워크 전환 시도
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // 네트워크가 없으면 추가
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
      // 1. 먼저 계정 연결 요청
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

      // 3. Provider 생성 및 정보 조회
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);

      // 잔액 조회 시도 (실패해도 지갑 연결은 유지)
      try {
        const balanceBigInt = await browserProvider.getBalance(address);
        const balanceInMon = (Number(balanceBigInt) / 1e18).toFixed(4);
        setBalance(balanceInMon);
        console.log("✅ Balance:", balanceInMon, "MON");
      } catch (balanceError) {
        console.warn("⚠️  Could not fetch balance, but wallet is connected");
        setBalance("0.0000"); // 기본값 설정
      }

      console.log("✅ Wallet connected:", address);
      console.log("✅ Network: Monad Testnet");
    } catch (error: any) {
      console.error("❌ Wallet connection failed:", error);
      alert(`지갑 연결 실패: ${error.message || "알 수 없는 오류"}`);
    }
  };

  // 지갑 연결 해제
  const disconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
  };

  // 컴포넌트 마운트 시 지갑 상태 확인
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum === "undefined") {
        return;
      }

      try {
        // 이미 연결된 계정이 있는지 확인
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          // 계정이 연결되어 있으면 정보 업데이트
          const browserProvider = new BrowserProvider(window.ethereum);
          const network = await browserProvider.getNetwork();

          // Monad 테스트넷인지 확인 (Chain ID: 10143)
          if (network.chainId === BigInt(10143)) {
            const signer = await browserProvider.getSigner();
            const address = await signer.getAddress();

            setWalletAddress(address);

            // 잔액 조회 시도
            try {
              const balanceBigInt = await browserProvider.getBalance(address);
              const balanceInMon = (Number(balanceBigInt) / 1e18).toFixed(4);
              setBalance(balanceInMon);
            } catch (balanceError) {
              console.warn("⚠️  Could not fetch balance");
              setBalance("0.0000");
            }

            console.log("✅ Wallet already connected:", address);
          } else {
            console.log("⚠️  Wrong network, please switch to Monad Testnet");
          }
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
      }
    };

    checkWalletConnection();

    // 계정 변경 감지
    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: any) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkWalletConnection();
        }
      });

      // 네트워크 변경 감지
      window.ethereum.on?.("chainChanged", () => {
        checkWalletConnection();
      });
    }
  }, []);

  const handleChainSelect = (chainId: string) => {
    // ETH를 선택하면 deposit 페이지로 이동
    router.push(`/chain/${chainId}/deposit`);
  };

  return (
    <div className="min-h-screen bg-[#0A0118] relative overflow-hidden">
      {/* Enhanced animated background with gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6E54FF]/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#B9E3F9]/10 via-transparent to-transparent" />

        {/* Animated orbs with different speeds */}
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
        <motion.div
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.1, 1.2, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-r from-[#FF8EE4]/10 to-[#6E54FF]/10 rounded-full blur-3xl"
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Wallet Connection Bar - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-end mb-12"
        >
          {walletAddress ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-4 px-8 py-4 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/20"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#6E54FF] via-[#8B6FFF] to-[#A88FFF] flex items-center justify-center shadow-lg shadow-[#6E54FF]/30"
                >
                  <Wallet className="h-6 w-6 text-white" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#DDD7FE]/60 font-semibold tracking-wide uppercase">Connected</span>
                  <span className="text-base text-white font-bold tracking-tight">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </span>
                </div>
              </div>
              {balance && (
                <div className="ml-2 px-5 py-2.5 rounded-2xl bg-gradient-to-br from-[#6E54FF]/10 to-[#FF8EE4]/10 border border-[#6E54FF]/20 backdrop-blur-sm">
                  <span className="text-sm text-white font-bold">{balance} <span className="text-[#DDD7FE]/80">MON</span></span>
                </div>
              )}
              <button
                onClick={disconnectWallet}
                className="ml-3 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-[#DDD7FE] hover:text-white transition-all duration-300 font-semibold"
              >
                Disconnect
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectWallet}
              className="group relative flex items-center gap-3 px-8 py-4 rounded-3xl bg-gradient-to-r from-[#6E54FF] via-[#8B6FFF] to-[#A88FFF] hover:from-[#7E64FF] hover:via-[#9B7FFF] hover:to-[#B89FFF] transition-all duration-300 shadow-2xl shadow-[#6E54FF]/30 hover:shadow-[#6E54FF]/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 group-hover:translate-x-full transition-transform duration-1000" />
              <Wallet className="h-5 w-5 text-white relative z-10 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-sm text-white font-bold relative z-10 tracking-wide">Connect Wallet</span>
            </motion.button>
          )}
        </motion.div>

        {/* Hero Section - Ultra Modern */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-20 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-8 px-6 py-3 rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl shadow-[#6E54FF]/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-[#6E54FF]" />
            </motion.div>
            <span className="text-sm text-white font-semibold tracking-wide">Blockchain Price Prediction Game</span>
          </motion.div>

          {/* Main Title with funky style */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 text-7xl sm:text-8xl lg:text-9xl font-black relative z-10"
            style={{ fontFamily: "'Poppins', 'Inter', sans-serif", letterSpacing: '-0.02em' }}
          >
            <span className="relative inline-block">
              {/* Glow effect background */}
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#FF0080] bg-clip-text text-transparent blur-2xl opacity-50 animate-pulse">
                Monder
              </span>
              {/* Main text with wave animation */}
              <span className="relative inline-flex bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#FF0080] bg-clip-text">
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block"
                >
                  M
                </motion.span>
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
                  className="inline-block"
                >
                  o
                </motion.span>
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  className="inline-block"
                >
                  n
                </motion.span>
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  className="inline-block"
                >
                  d
                </motion.span>
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  className="inline-block"
                >
                  e
                </motion.span>
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="inline-block"
                >
                  r
                </motion.span>
              </span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto max-w-3xl text-xl sm:text-2xl text-white/80 leading-relaxed mb-12 font-light"
          >
            Predict real-time crypto prices and <span className="text-white font-semibold">win big</span>
            <br />
            <span className="text-white/60 text-lg">Join the game on multiple blockchain networks</span>
          </motion.p>
        </motion.div>

        {/* Chain Cards Grid - Ultra Modern Bento Style */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {chains.map((chain, index) => (
            <motion.button
              key={chain.id}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleChainSelect(chain.id)}
              className="group relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 text-left transition-all duration-500 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-2xl hover:shadow-[#6E54FF]/30"
            >
              {/* Animated gradient background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${chain.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                initial={false}
              />

              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
              />

              <div className="relative z-10">
                {/* Icon and Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${chain.color} p-3 flex items-center justify-center shadow-xl shadow-black/40 border border-white/20 backdrop-blur-sm`}
                    >
                      <Image
                        src={chain.logoUrl}
                        alt={`${chain.name} logo`}
                        width={64}
                        height={64}
                        className="w-full h-full object-contain"
                        unoptimized
                      />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
                        {chain.name}
                      </h3>
                      <p className="text-sm text-white/60 font-semibold tracking-wider uppercase">
                        {chain.symbol}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.2, rotate: 45 }}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300 mb-6">
                  {chain.description}
                </p>

                {/* Animated progress bar */}
                <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${chain.color} rounded-full`}
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>

                {/* Floating particles effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute h-1 w-1 rounded-full bg-gradient-to-r ${chain.color} opacity-0 group-hover:opacity-60`}
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${30 + i * 20}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        opacity: [0, 0.6, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Footer - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-xl">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-[#6E54FF] to-[#FF8EE4]"
            />
            <p className="text-sm text-white/70 font-medium">
              Select a blockchain network to start playing
            </p>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6 text-xs text-white/40"
          >
            Powered by Monad Testnet
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

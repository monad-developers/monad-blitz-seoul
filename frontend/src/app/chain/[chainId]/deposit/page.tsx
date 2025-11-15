"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Wallet, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BrowserProvider, Contract, Eip1193Provider, parseEther } from "ethers";
import OXGameV2ABI from "./OXGameV2.json";
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

const CONTRACT_ADDRESS = "0xd7DB3033F906771c37d54548267b61481e6CfbE9";
const DEPOSIT_AMOUNT = "1"; // 1 MON

export default function DepositPage() {
  const router = useRouter();
  const params = useParams();
  const chainId = params.chainId as string;

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError("MetaMask를 설치해주세요!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const switched = await switchToMonadTestnet();
      if (!switched) {
        setError("Monad 테스트넷으로 전환해주세요!");
        return;
      }

      setWalletAddress(accounts[0]);
      setError(null);
      console.log("✅ Wallet connected:", accounts[0]);
    } catch (error: any) {
      console.error("❌ Wallet connection failed:", error);
      setError(error.message || "지갑 연결 실패");
    }
  };

  // Deposit 실행
  const handleDeposit = async () => {
    if (!walletAddress) {
      setError("먼저 지갑을 연결해주세요!");
      return;
    }

    setIsDepositing(true);
    setError(null);

    try {
      // ABI 인코딩을 위한 Interface 생성 (Contract 객체 없이)
      const iface = new Contract(CONTRACT_ADDRESS, OXGameV2ABI.abi).interface;

      // ChainType.ETH = 0
      const chainType = 0;

      // joinPool 함수 데이터 인코딩
      const data = iface.encodeFunctionData("joinPool", [chainType]);

      console.log("📤 Depositing 1 MON...");
      console.log("Transaction data:", data);

      // MetaMask를 통해 직접 트랜잭션 전송 (gas 자동 추정)
      const txHash = await window.ethereum!.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: CONTRACT_ADDRESS,
            value: "0xde0b6b3a7640000", // 1 ETH in hex (1000000000000000000 wei)
            data: data,
            gas: "0x55730", // 350000 in hex - manual gas limit to avoid estimation
          },
        ],
      }) as string;

      console.log("⏳ Transaction submitted!");
      console.log("TX Hash:", txHash);
      setTxHash(txHash);

      console.log("✅ Deposit transaction sent!");
      console.log("Check status at: https://explorer.testnet.monad.xyz/tx/" + txHash);

      setDepositSuccess(true);
      setIsDepositing(false);

      // 3초 후 rooms 페이지로 이동
      setTimeout(() => {
        router.push(`/chain/${chainId}/rooms`);
      }, 3000);
    } catch (error: any) {
      console.error("❌ Deposit failed:", error);

      // RPC 에러인 경우 더 친절한 메시지
      if (error.code === -32080 || error.message?.includes("RPC endpoint")) {
        setError("Monad 테스트넷 RPC 연결 오류입니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError(error.message || "Deposit 실패");
      }

      setIsDepositing(false);
    }
  };

  // 컴포넌트 마운트 시 지갑 자동 연결
  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E091C] via-[#6E54FF]/20 to-[#000000] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B9E3F9]/20 hover:bg-[#B9E3F9]/30 border border-[#B9E3F9]/30 hover:border-[#B9E3F9]/50 text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">돌아가기</span>
        </button>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8"
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Mon Blitz Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-[#6E54FF] to-[#6E54FF] mb-4">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">게임 참가하기</h1>
            <p className="text-[#DDD7FE]/80">
              1 MON을 입금하고 ETH 가격 예측 게임에 참여하세요
            </p>
          </div>

          {/* Wallet connection status */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-[#6E54FF]" />
                <div>
                  <p className="text-xs text-[#DDD7FE]/80">지갑 주소</p>
                  {walletAddress ? (
                    <p className="text-sm text-white font-mono">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                    </p>
                  ) : (
                    <p className="text-sm text-[#DDD7FE]/60">연결되지 않음</p>
                  )}
                </div>
              </div>
              {!walletAddress && (
                <button
                  onClick={connectWallet}
                  className="px-4 py-2 rounded-lg bg-[#6E54FF] hover:bg-[#6E54FF]/80 text-white text-sm font-bold transition-all"
                >
                  연결하기
                </button>
              )}
            </div>
          </div>

          {/* Deposit details */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[#DDD7FE]/80">입금 금액</span>
              <span className="text-white font-bold text-lg">1 MON</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[#DDD7FE]/80">게임 타입</span>
              <span className="text-white font-bold">ETH 가격 예측</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[#DDD7FE]/80">컨트랙트</span>
              <span className="text-white font-mono text-xs">
                {CONTRACT_ADDRESS.substring(0, 6)}...{CONTRACT_ADDRESS.substring(38)}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {depositSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="flex-1">
                  <p className="text-green-400 font-bold">입금 성공!</p>
                  {txHash && (
                    <p className="text-green-300 text-xs font-mono mt-1">
                      TX: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                    </p>
                  )}
                  <p className="text-green-300 text-xs mt-1">곧 게임 로비로 이동합니다...</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Deposit button */}
          <button
            onClick={handleDeposit}
            disabled={!walletAddress || isDepositing || depositSuccess}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6E54FF] to-[#6E54FF] hover:from-[#6E54FF]/80 hover:to-[#6E54FF]/80 disabled:from-[#0E091C] disabled:to-[#0E091C] disabled:cursor-not-allowed text-white font-bold text-lg transition-all shadow-lg shadow-[#6E54FF]/20 hover:shadow-[#6E54FF]/40 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isDepositing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>처리 중...</span>
              </>
            ) : depositSuccess ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span>입금 완료</span>
              </>
            ) : (
              <>
                <Coins className="h-5 w-5" />
                <span>1 MON 입금하기</span>
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 rounded-xl bg-[#6E54FF]/10 border border-[#6E54FF]/20">
            <p className="text-[#DDD7FE] text-xs text-center">
              💡 입금한 MON은 게임에서 사용됩니다. 최종 승자가 모든 상금을 가져갑니다.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

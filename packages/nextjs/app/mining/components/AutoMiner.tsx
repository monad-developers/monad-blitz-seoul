"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEther, parseAbi, parseGwei } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface AdvancedMiningStats {
  attempts: number;
  successes: number;
  earned: number;
  startTime: Date;
  successRate: number;
  tps: number;
  avgGasUsed: number;
  totalGasCost: number;
  netProfit: number;
}

interface EnhancedMiningLog {
  timestamp: Date;
  nftId: number;
  success: boolean;
  randomNumber?: bigint;
  gasUsed: bigint;
  gasPrice: bigint;
  txHash: string;
  blockNumber?: bigint;
}

interface OptimalNFT {
  id: number;
  name: string;
  type: number;
  successRate: number;
  expectedRevenue: number;
  isOptimal: boolean;
}

export default function AutoMiner() {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();

  // 고급 상태 관리
  const [isAutoMining, setIsAutoMining] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<OptimalNFT | null>(null);
  const [miningStats, setMiningStats] = useState<AdvancedMiningStats>({
    attempts: 0,
    successes: 0,
    earned: 0,
    startTime: new Date(),
    successRate: 0,
    tps: 0,
    avgGasUsed: 0,
    totalGasCost: 0,
    netProfit: 0,
  });
  const [miningLogs, setMiningLogs] = useState<EnhancedMiningLog[]>([]);
  const [autoMiningSpeed, setAutoMiningSpeed] = useState(200); // 200ms = 5 TPS
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [gasPrice, setGasPrice] = useState<bigint>(0n);

  // Refs for auto mining
  const autoMiningRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoMiningRef = useRef(false);
  const statsRef = useRef<AdvancedMiningStats>({
    attempts: 0,
    successes: 0,
    earned: 0,
    startTime: new Date(),
    successRate: 0,
    tps: 0,
    avgGasUsed: 0,
    totalGasCost: 0,
    netProfit: 0,
  });

  // 컨트랙트 연결
  const { data: miningEngine } = useScaffoldContract({ contractName: "MiningEngine" });

  // 읽기 함수들
  const { data: currentRound, refetch: refetchRound } = useScaffoldReadContract({
    contractName: "GameManager",
    functionName: "getCurrentRound",
  });

  const { data: ownedNFTs } = useScaffoldReadContract({
    contractName: "MinerNFT",
    functionName: "getOwnedMiners",
    args: [connectedAddress],
  });

  // 쓰기 함수
  const { writeContractAsync: writeMiningEngine } = useScaffoldWriteContract({
    contractName: "MiningEngine",
  });

  // NFT 최적화 계산
  const [optimalNFTs, setOptimalNFTs] = useState<OptimalNFT[]>([]);

  // 가스 가격 모니터링
  useEffect(() => {
    const updateGasPrice = async () => {
      if (!publicClient) return;

      try {
        const price = await publicClient.getGasPrice();
        setGasPrice(price);
      } catch (error) {
        console.error("가스 가격 조회 실패:", error);
      }
    };

    updateGasPrice();
    const interval = setInterval(updateGasPrice, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, [publicClient]);

  // NFT 최적화 계산
  const calculateOptimalNFTs = useCallback(async () => {
    if (!ownedNFTs || !currentRound || !miningEngine) return;

    const nfts: OptimalNFT[] = [];

    for (const nftId of ownedNFTs) {
      try {
        // NFT 정보 조회
        const stats = await miningEngine.read.getMinerStats([nftId]);
        const effectiveRate = await miningEngine.read.calculateEffectiveSuccessRate([nftId, currentRound.pattern]);

        // 예상 수익 계산
        const successRateDecimal = Number(effectiveRate) / 10000; // 0.0001 단위
        const expectedRevenue = successRateDecimal * 27; // 27 MM per success
        const gasCostInETH = Number(formatEther(gasPrice * 200000n)); // 예상 가스비
        const netRevenue = expectedRevenue - gasCostInETH;

        nfts.push({
          id: Number(nftId),
          name: stats.name,
          type: stats.minerType,
          successRate: successRateDecimal * 100,
          expectedRevenue: netRevenue,
          isOptimal: false,
        });
      } catch (error) {
        console.error(`NFT ${nftId} 분석 실패:`, error);
      }
    }

    // 최적 NFT 선택 (순수익이 가장 높은 것)
    if (nfts.length > 0) {
      const bestNFT = nfts.reduce((best, current) => (current.expectedRevenue > best.expectedRevenue ? current : best));
      bestNFT.isOptimal = true;
    }

    setOptimalNFTs(nfts);

    // 자동 최적화가 켜져있고 더 좋은 NFT가 있으면 교체
    if (autoOptimize && nfts.length > 0) {
      const currentOptimal = nfts.find(n => n.isOptimal);
      if (currentOptimal && (!selectedNFT || currentOptimal.id !== selectedNFT.id)) {
        setSelectedNFT(currentOptimal);
        if (isAutoMining) {
          notification.info(`🔄 자동 NFT 교체: ${currentOptimal.name} (#${currentOptimal.id})`);
        }
      }
    }
  }, [ownedNFTs, currentRound, miningEngine, gasPrice, autoOptimize, selectedNFT, isAutoMining]);

  useEffect(() => {
    calculateOptimalNFTs();
  }, [calculateOptimalNFTs]);

  // 라운드 변경 감지
  useEffect(() => {
    const checkRoundChange = setInterval(() => {
      refetchRound();
    }, 5000); // 5초마다 라운드 체크

    return () => clearInterval(checkRoundChange);
  }, [refetchRound]);

  // 실제 채굴 함수 (이벤트 기반)
  const performAdvancedMining = async () => {
    if (!selectedNFT || !miningEngine || !publicClient) return;

    try {
      // 최적화된 가스 설정
      const optimizedGasPrice = gasPrice + parseGwei("1"); // 1 gwei 추가

      // 트랜잭션 전송
      const txHash = await writeMiningEngine({
        functionName: "attemptMining",
        args: [BigInt(selectedNFT.id)],
        gas: 250000n,
        gasPrice: optimizedGasPrice,
      });

      // 트랜잭션 확인 대기
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 이벤트 파싱
      const miningAttemptEvent = receipt.logs.find(log => {
        try {
          const decoded = publicClient.parseEventLogs({
            abi: parseAbi([
              "event MiningAttemptMade(address indexed player, uint256 indexed nftId, uint256 randomNumber, bool success, uint256 roundId, uint256 timestamp)",
            ]),
            logs: [log],
          });
          return decoded.length > 0;
        } catch {
          return false;
        }
      });

      let isSuccess = false;
      let randomNumber: bigint = 0n;

      if (miningAttemptEvent) {
        const decoded = publicClient.parseEventLogs({
          abi: parseAbi([
            "event MiningAttemptMade(address indexed player, uint256 indexed nftId, uint256 randomNumber, bool success, uint256 roundId, uint256 timestamp)",
          ]),
          logs: [miningAttemptEvent],
        });

        if (decoded.length > 0) {
          isSuccess = decoded[0].args.success as boolean;
          randomNumber = decoded[0].args.randomNumber as bigint;
        }
      }

      // 통계 업데이트
      const newStats = { ...statsRef.current };
      newStats.attempts += 1;

      const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
      const gasCostInETH = Number(formatEther(gasCost));

      newStats.totalGasCost += gasCostInETH;
      newStats.avgGasUsed = Number(receipt.gasUsed);

      if (isSuccess) {
        newStats.successes += 1;
        newStats.earned += 27;
      }

      newStats.netProfit = newStats.earned - newStats.totalGasCost;

      const elapsed = (Date.now() - newStats.startTime.getTime()) / 1000;
      newStats.tps = newStats.attempts / elapsed;
      newStats.successRate = (newStats.successes / newStats.attempts) * 100;

      statsRef.current = newStats;
      setMiningStats(newStats);

      // 로그 추가
      const newLog: EnhancedMiningLog = {
        timestamp: new Date(),
        nftId: selectedNFT.id,
        success: isSuccess,
        randomNumber,
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.effectiveGasPrice,
        txHash,
        blockNumber: receipt.blockNumber,
      };

      setMiningLogs(prev => [newLog, ...prev.slice(0, 49)]); // 최근 50개만 유지

      if (isSuccess) {
        notification.success(`🎉 채굴 성공! +27 MM | 총 ${newStats.successes}회 성공`);
      }
    } catch (error: any) {
      console.error("고급 채굴 실패:", error);

      if (error.message?.includes("insufficient funds")) {
        stopAutoMining();
        notification.error("💸 자금 부족으로 채굴 중단");
      } else if (error.message?.includes("User rejected")) {
        stopAutoMining();
        notification.error("🚫 사용자가 트랜잭션을 거부");
      }
    }
  };

  // 자동채굴 시작 (고급)
  const startAdvancedAutoMining = async () => {
    if (!selectedNFT) {
      notification.error("NFT를 선택해주세요");
      return;
    }

    if (!connectedAddress) {
      notification.error("지갑을 연결해주세요");
      return;
    }

    try {
      // 최초 한번 권한 확인
      await writeMiningEngine({
        functionName: "attemptMining",
        args: [BigInt(selectedNFT.id)],
      });

      // 자동채굴 초기화
      setIsAutoMining(true);
      isAutoMiningRef.current = true;

      const initialStats: AdvancedMiningStats = {
        attempts: 0,
        successes: 0,
        earned: 0,
        startTime: new Date(),
        successRate: 0,
        tps: 0,
        avgGasUsed: 0,
        totalGasCost: 0,
        netProfit: 0,
      };

      statsRef.current = initialStats;
      setMiningStats(initialStats);
      setMiningLogs([]);

      notification.success(`🚀 고급 자동채굴 시작! (${(1000 / autoMiningSpeed).toFixed(1)} TPS)`);

      // 고성능 채굴 루프
      const advancedMiningLoop = () => {
        if (!isAutoMiningRef.current) return;

        performAdvancedMining().catch(console.error);

        // 다음 채굴 스케줄링
        autoMiningRef.current = setTimeout(advancedMiningLoop, autoMiningSpeed);
      };

      // 즉시 시작
      autoMiningRef.current = setTimeout(advancedMiningLoop, 100);
    } catch (error: any) {
      console.error("고급 자동채굴 시작 실패:", error);
      notification.error("자동채굴 시작 실패: " + error.message);
      setIsAutoMining(false);
      isAutoMiningRef.current = false;
    }
  };

  // 자동채굴 중지
  const stopAutoMining = () => {
    setIsAutoMining(false);
    isAutoMiningRef.current = false;

    if (autoMiningRef.current) {
      clearTimeout(autoMiningRef.current);
      autoMiningRef.current = null;
    }

    notification.info("⏹️ 자동채굴 중지됨");
  };

  // 정리
  useEffect(() => {
    return () => {
      if (autoMiningRef.current) {
        clearTimeout(autoMiningRef.current);
      }
    };
  }, []);

  // 헬퍼 함수들
  const getPatternName = (pattern: number) => {
    const patterns = ["EVEN", "ODD", "PRIME", "PI", "SQUARE"];
    return patterns[pattern] || "UNKNOWN";
  };

  const getNFTTypeName = (type: number) => {
    const types = ["EvenBlaster", "PrimeSniper", "BalancedScan", "PiSniper", "SquareSeeker"];
    return types[type] || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">⚡ 고급 자동채굴 시스템</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 컨트롤 패널 */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">🎛️ 컨트롤 패널</h2>

            {/* 현재 라운드 */}
            {currentRound && (
              <div className="bg-white/20 rounded-lg p-4 mb-4">
                <h3 className="font-bold mb-2">🎯 현재 라운드</h3>
                <p>라운드: {currentRound.roundId?.toString()}</p>
                <p>
                  패턴:{" "}
                  <span className="font-bold text-yellow-300">{getPatternName(Number(currentRound.pattern))}</span>
                </p>
                <p>
                  범위: {currentRound.minRange?.toString()} ~ {currentRound.maxRange?.toString()}
                </p>
              </div>
            )}

            {/* NFT 선택 */}
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-2">🤖 최적 NFT 선택</h3>
              {optimalNFTs.length > 0 ? (
                <select
                  className="select select-bordered w-full bg-black/50 text-white"
                  value={selectedNFT?.id || ""}
                  onChange={e => {
                    const nft = optimalNFTs.find(n => n.id === Number(e.target.value));
                    setSelectedNFT(nft || null);
                  }}
                >
                  {optimalNFTs.map(nft => (
                    <option key={nft.id} value={nft.id} className="bg-black">
                      {nft.isOptimal ? "⭐ " : ""}#{nft.id} {getNFTTypeName(nft.type)}({nft.successRate.toFixed(3)}% |{" "}
                      {nft.expectedRevenue.toFixed(4)} ETH)
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-300">NFT 로딩 중...</p>
              )}

              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={autoOptimize}
                  onChange={e => setAutoOptimize(e.target.checked)}
                  className="checkbox checkbox-sm mr-2"
                />
                <span className="text-sm">자동 최적화</span>
              </div>
            </div>

            {/* 채굴 속도 */}
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-2">⚡ 채굴 속도</h3>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={autoMiningSpeed}
                onChange={e => setAutoMiningSpeed(Number(e.target.value))}
                className="range range-primary w-full"
                disabled={isAutoMining}
              />
              <div className="flex justify-between text-xs mt-1">
                <span>10 TPS</span>
                <span>5 TPS</span>
                <span>1 TPS</span>
              </div>
              <p className="text-center mt-2 font-bold">{(1000 / autoMiningSpeed).toFixed(1)} TPS</p>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="flex gap-3">
              <button
                className="btn btn-primary flex-1"
                onClick={startAdvancedAutoMining}
                disabled={isAutoMining || !selectedNFT || !connectedAddress}
              >
                {isAutoMining ? "🔄 채굴 중..." : "🚀 시작"}
              </button>

              <button className="btn btn-error" onClick={stopAutoMining} disabled={!isAutoMining}>
                ⏹️ 중지
              </button>
            </div>
          </div>

          {/* 가운데: 실시간 통계 */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">📊 실시간 통계</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-500/30 rounded-lg p-3">
                <p className="text-blue-200">총 시도</p>
                <p className="text-2xl font-bold">{miningStats.attempts}</p>
              </div>

              <div className="bg-green-500/30 rounded-lg p-3">
                <p className="text-green-200">성공</p>
                <p className="text-2xl font-bold">{miningStats.successes}</p>
              </div>

              <div className="bg-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-200">성공률</p>
                <p className="text-2xl font-bold">{miningStats.successRate.toFixed(2)}%</p>
              </div>

              <div className="bg-purple-500/30 rounded-lg p-3">
                <p className="text-purple-200">TPS</p>
                <p className="text-2xl font-bold">{miningStats.tps.toFixed(1)}</p>
              </div>

              <div className="bg-orange-500/30 rounded-lg p-3">
                <p className="text-orange-200">획득 MM</p>
                <p className="text-2xl font-bold">{miningStats.earned}</p>
              </div>

              <div className="bg-red-500/30 rounded-lg p-3">
                <p className="text-red-200">순수익</p>
                <p className="text-2xl font-bold">{miningStats.netProfit.toFixed(4)} ETH</p>
              </div>
            </div>

            {/* 가스 정보 */}
            <div className="bg-white/20 rounded-lg p-4 mt-4">
              <h3 className="font-bold mb-2">⛽ 가스 정보</h3>
              <p>현재 가스 가격: {formatEther(gasPrice)} ETH</p>
              <p>평균 가스 사용량: {miningStats.avgGasUsed.toLocaleString()}</p>
              <p>총 가스 비용: {miningStats.totalGasCost.toFixed(6)} ETH</p>
            </div>
          </div>

          {/* 오른쪽: 실시간 로그 */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">📝 실시간 로그</h2>

            <div className="h-96 overflow-y-auto space-y-2">
              {miningLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-xs ${
                    log.success
                      ? "bg-green-500/30 border-l-4 border-green-500"
                      : "bg-red-500/30 border-l-4 border-red-500"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">#{log.nftId}</span>
                    <span>{log.success ? "🎉 성공" : "❌ 실패"}</span>
                  </div>
                  <div className="text-gray-300">
                    <p>시간: {log.timestamp.toLocaleTimeString()}</p>
                    <p>가스: {log.gasUsed.toLocaleString()}</p>
                    <p>블록: #{log.blockNumber?.toString()}</p>
                  </div>
                </div>
              ))}

              {miningLogs.length === 0 && (
                <div className="text-center text-gray-400 mt-8">
                  채굴 로그가 없습니다
                  <br />
                  채굴을 시작해보세요!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { notification } from "~~/utils/scaffold-eth";
import { Address } from "./scaffold-eth/Address/Address";

export const TokenDeposit = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedToken, setSelectedToken] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const { writeContractAsync: writeTokenMinterAsync } = useScaffoldWriteContract({
    contractName: "TokenMinter",
  });

  // Get all created tokens
  const { data: allTokens } = useScaffoldReadContract({
    contractName: "TokenMinter",
    functionName: "getAllTokens",
  });

  // Get TokenMinter contract address
  const { data: tokenMinterAddress } = useScaffoldReadContract({
    contractName: "TokenMinter",
    functionName: "getContractAddress",
  });

  // Get user's USDx balance
  const { data: usdxBalance } = useScaffoldReadContract({
    contractName: "USDxToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  useEffect(() => {
    if (allTokens && allTokens.length > 0) {
      setAvailableTokens([...allTokens]);
      if (selectedToken === "" && allTokens.length > 0) {
        setSelectedToken(allTokens[0]);
      }
    }
  }, [allTokens, selectedToken]);

  // Get token balance for selected token (simplified for now)
  const [tokenBalance, setTokenBalance] = useState<string>("0");

  const { writeContract } = useWriteContract();

  const handleApprove = async () => {
    if (!connectedAddress || !selectedToken || !tokenMinterAddress) {
      notification.error("필요한 정보가 누락되었습니다!");
      return;
    }

    if (!depositAmount.trim()) {
      notification.error("수량을 입력해주세요!");
      return;
    }

    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      notification.error("유효한 수량을 입력해주세요!");
      return;
    }

    setIsApproving(true);

    try {
      const { parseAbi } = await import("viem");
      
      const tokenAbi = parseAbi([
        "function approve(address spender, uint256 amount) external returns (bool)"
      ]);

      await writeContract({
        address: selectedToken as `0x${string}`,
        abi: tokenAbi,
        functionName: "approve",
        args: [tokenMinterAddress, BigInt(amount * 10**18)],
      });

      notification.success("토큰 승인이 완료되었습니다!");
      setIsApproved(true);
    } catch (error) {
      console.error("토큰 승인 중 오류 발생:", error);
      notification.error("토큰 승인 중 오류가 발생했습니다!");
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!connectedAddress) {
      notification.error("지갑을 연결해주세요!");
      return;
    }

    if (!selectedToken) {
      notification.error("토큰을 선택해주세요!");
      return;
    }

    if (!depositAmount.trim()) {
      notification.error("수량을 입력해주세요!");
      return;
    }

    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      notification.error("유효한 수량을 입력해주세요!");
      return;
    }

    setIsLoading(true);

    try {
      const result = await writeTokenMinterAsync({
        functionName: "depositToken",
        args: [selectedToken, BigInt(amount * 10**18)],
      });

      if (result) {
        notification.success("토큰이 성공적으로 USDx로 교환되었습니다!");
        setDepositAmount("");
        setIsApproved(false); // Reset approval status
      }
    } catch (error) {
      console.error("토큰 교환 중 오류 발생:", error);
      notification.error("토큰 교환 중 오류가 발생했습니다! 먼저 토큰 승인이 필요할 수 있습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-md rounded-3xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">토큰 Deposit</h2>
      
      <div className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">토큰 선택</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="select select-bordered w-full"
            disabled={isLoading}
          >
            <option value="">토큰을 선택하세요</option>
            {availableTokens.map((token, index) => (
              <option key={index} value={token}>
                토큰 {index + 1}: {token.slice(0, 6)}...{token.slice(-4)}
              </option>
            ))}
          </select>
        </div>

        {selectedToken && (
          <div className="text-sm text-gray-600">
            <span>토큰 주소: {selectedToken.slice(0, 6)}...{selectedToken.slice(-4)}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">교환할 수량</label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="예: 100"
            className="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>

        {usdxBalance && (
          <div className="text-sm text-gray-600">
            <span>현재 USDx 보유량: {usdxBalance.toString()}</span>
          </div>
        )}

        <button
          onClick={handleApprove}
          disabled={isApproving || !connectedAddress || !selectedToken || !depositAmount}
          className="btn btn-secondary w-full"
        >
          {isApproving ? "승인 중..." : "토큰 승인"}
        </button>

        <button
          onClick={handleDeposit}
          disabled={isLoading || !connectedAddress || !selectedToken || !isApproved}
          className="btn btn-primary w-full"
        >
          {isLoading ? "교환 중..." : "토큰을 USDx로 교환"}
        </button>

        <div className="text-sm text-gray-600">
          <span>받는 주소: <Address address={connectedAddress} /></span>
        </div>
      </div>
    </div>
  );
}; 
"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { notification } from "~~/utils/scaffold-eth";
import { Address } from "./scaffold-eth/Address/Address";
import deployedContracts from "~~/contracts/deployedContracts";

export const TokenRedeem = () => {
  const { address: connectedAddress } = useAccount();
  const [selectedToken, setSelectedToken] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
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

  // Get USDx token address
  const usdxTokenAddress = deployedContracts[31337]?.USDxToken?.address;

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

  const { writeContract } = useWriteContract();

  const handleApprove = async () => {
    if (!connectedAddress || !tokenMinterAddress || !usdxTokenAddress) {
      notification.error("필요한 정보가 누락되었습니다!");
      return;
    }

    if (!redeemAmount.trim()) {
      notification.error("수량을 입력해주세요!");
      return;
    }

    const amount = parseInt(redeemAmount);
    if (isNaN(amount) || amount <= 0) {
      notification.error("유효한 수량을 입력해주세요!");
      return;
    }

    setIsApproving(true);

    try {
      const { parseAbi } = await import("viem");
      
      const usdxAbi = parseAbi([
        "function approve(address spender, uint256 amount) external returns (bool)"
      ]);

      await writeContract({
        address: usdxTokenAddress as `0x${string}`,
        abi: usdxAbi,
        functionName: "approve",
        args: [tokenMinterAddress, BigInt(amount * 10**18)],
      });

      notification.success("USDx 승인이 완료되었습니다!");
      setIsApproved(true);
    } catch (error) {
      console.error("USDx 승인 중 오류 발생:", error);
      notification.error("USDx 승인 중 오류가 발생했습니다!");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRedeem = async () => {
    if (!connectedAddress) {
      notification.error("지갑을 연결해주세요!");
      return;
    }

    if (!selectedToken) {
      notification.error("토큰을 선택해주세요!");
      return;
    }

    if (!redeemAmount.trim()) {
      notification.error("수량을 입력해주세요!");
      return;
    }

    const amount = parseInt(redeemAmount);
    if (isNaN(amount) || amount <= 0) {
      notification.error("유효한 수량을 입력해주세요!");
      return;
    }

    setIsLoading(true);

    try {
      const result = await writeTokenMinterAsync({
        functionName: "redeemToken",
        args: [selectedToken, BigInt(amount * 10**18)],
      });

      if (result) {
        notification.success("USDx가 성공적으로 원래 토큰으로 상환되었습니다!");
        setRedeemAmount("");
        setIsApproved(false); // Reset approval status
      }
    } catch (error) {
      console.error("토큰 상환 중 오류 발생:", error);
      notification.error("토큰 상환 중 오류가 발생했습니다! 먼저 USDx 승인이 필요할 수 있습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-md rounded-3xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">토큰 Redeem</h2>
      
      <div className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">상환할 토큰 선택</label>
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
            <span>상환할 토큰 주소: {selectedToken.slice(0, 6)}...{selectedToken.slice(-4)}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">상환할 USDx 수량</label>
          <input
            type="number"
            value={redeemAmount}
            onChange={(e) => setRedeemAmount(e.target.value)}
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
          disabled={isApproving || !connectedAddress || !redeemAmount}
          className="btn btn-secondary w-full"
        >
          {isApproving ? "승인 중..." : "USDx 승인"}
        </button>

        <button
          onClick={handleRedeem}
          disabled={isLoading || !connectedAddress || !selectedToken || !isApproved}
          className="btn btn-primary w-full"
        >
          {isLoading ? "상환 중..." : "USDx를 토큰으로 상환"}
        </button>

        <div className="text-sm text-gray-600">
          <span>받는 주소: <Address address={connectedAddress} /></span>
        </div>
      </div>
    </div>
  );
}; 
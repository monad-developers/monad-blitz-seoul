"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { Address } from "./scaffold-eth/Address/Address";

interface TokenBalance {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
}

export const TokenBalanceTable = () => {
  const { address: connectedAddress } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const publicClient = usePublicClient();

  // Get all created tokens
  const { data: allTokens } = useScaffoldReadContract({
    contractName: "TokenMinter",
    functionName: "getAllTokens",
  });

  // Get USDx token address
  const { data: usdxTokenAddress } = useScaffoldReadContract({
    contractName: "TokenMinter",
    functionName: "usdxToken",
  });

  // Get user's USDx balance
  const { data: usdxBalance } = useScaffoldReadContract({
    contractName: "USDxToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Create a component for individual token balance
  const TokenBalanceRow = ({ tokenAddress, index, refreshKey }: { tokenAddress: string; index: number; refreshKey: number }) => {
    const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        { name: "balanceOf", type: "function", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
        { name: "name", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
        { name: "symbol", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" }
      ] as const,
      functionName: "balanceOf",
      args: [connectedAddress as `0x${string}`],
    });

    const { data: tokenName } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        { name: "name", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" }
      ] as const,
      functionName: "name",
    });

    const { data: tokenSymbol } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: [
        { name: "symbol", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" }
      ] as const,
      functionName: "symbol",
    });

    return (
      <tr>
        <td className="font-medium">{tokenName || `토큰 ${index + 1}`}</td>
        <td className="font-mono">{tokenSymbol || `TKN${index + 1}`}</td>
        <td className="font-mono">
          {tokenBalance ? formatBalance(tokenBalance.toString(), 18) : "0"}
        </td>
        <td>
          <Address address={tokenAddress as `0x${string}`} />
        </td>
      </tr>
    );
  };

  // Remove the useEffect since we're using individual hooks now

  const formatBalance = (balance: string, decimals: number) => {
    const balanceNumber = parseInt(balance) / Math.pow(10, decimals);
    return balanceNumber.toLocaleString();
  };

  const handleRefresh = () => {
    // Simple page refresh to get latest data
    window.location.reload();
  };

  if (!connectedAddress) {
    return (
      <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-4xl rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6">토큰 보유량</h2>
        <p className="text-gray-600">지갑을 연결해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-4xl rounded-3xl shadow-xl">
      <div className="flex justify-between items-center w-full mb-6">
        <h2 className="text-2xl font-bold">토큰 보유량</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn btn-sm btn-outline"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            "새로고침"
          )}
        </button>
      </div>
      
      <div className="w-full">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-2">토큰 정보를 불러오는 중...</span>
          </div>
        ) : !allTokens || allTokens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">보유한 토큰이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-2">토큰을 mint하거나 받아보세요!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>토큰명</th>
                  <th>심볼</th>
                  <th>보유량</th>
                  <th>토큰 주소</th>
                </tr>
              </thead>
              <tbody>
                {/* USDx Token Row */}
                {usdxTokenAddress && usdxBalance && (
                  <tr>
                    <td className="font-medium">USDx</td>
                    <td className="font-mono">USDx</td>
                    <td className="font-mono">
                      {formatBalance(usdxBalance.toString(), 18)}
                    </td>
                    <td>
                      <Address address={usdxTokenAddress as `0x${string}`} />
                    </td>
                  </tr>
                )}
                
                {/* Custom Token Rows */}
                {allTokens.map((tokenAddress, index) => (
                  <TokenBalanceRow key={`${index}-${refreshKey}`} tokenAddress={tokenAddress} index={index} refreshKey={refreshKey} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <span>지갑 주소: <Address address={connectedAddress} /></span>
      </div>
    </div>
  );
}; 
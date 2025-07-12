"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { notification } from "~~/utils/scaffold-eth";
import { Address } from "./scaffold-eth/Address/Address";

export const TokenMinter = () => {
  const { address: connectedAddress } = useAccount();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { writeContractAsync: writeTokenMinterAsync } = useScaffoldWriteContract({
    contractName: "TokenMinter",
  });

  const handleMintToken = async () => {
    if (!connectedAddress) {
      notification.error("지갑을 연결해주세요!");
      return;
    }

    if (!tokenName.trim() || !tokenSymbol.trim() || !tokenAmount.trim()) {
      notification.error("모든 필드를 입력해주세요!");
      return;
    }

    const amount = parseInt(tokenAmount);
    if (isNaN(amount) || amount <= 0) {
      notification.error("유효한 수량을 입력해주세요!");
      return;
    }

    setIsLoading(true);

    try {
      const result = await writeTokenMinterAsync({
        functionName: "createToken",
        args: [tokenName, tokenSymbol, BigInt(amount), connectedAddress],
      });

      if (result) {
        setTransactionHash(result);
        notification.success("토큰이 성공적으로 mint되었습니다!");
      }
    } catch (error) {
      console.error("토큰 mint 중 오류 발생:", error);
      notification.error("토큰 mint 중 오류가 발생했습니다!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-md rounded-3xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">토큰 Mint</h2>
      
      <div className="w-full space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">토큰 이름</label>
          <input
            type="text"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="예: MyToken"
            className="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">토큰 심볼</label>
          <input
            type="text"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            placeholder="예: MTK"
            className="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">수량</label>
          <input
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="예: 1000"
            className="input input-bordered w-full"
            disabled={isLoading}
          />
        </div>

        <div className="text-sm text-gray-600">
          <span>받는 주소: <Address address={connectedAddress} /></span>
        </div>

        <button
          onClick={handleMintToken}
          disabled={isLoading || !connectedAddress}
          className="btn btn-primary w-full"
        >
          {isLoading ? "Minting 중..." : "토큰 Mint"}
        </button>

        {transactionHash && (
          <div className="mt-4 p-4 bg-success/10 rounded-lg">
            <h3 className="font-bold text-success mb-2">Mint 완료!</h3>
            <p className="text-sm mb-2">트랜잭션 해시:</p>
            <p className="text-sm font-mono break-all">{transactionHash}</p>
            <p className="text-sm mt-2 text-gray-600">
              블록 익스플로러에서 트랜잭션을 확인하여 토큰 주소를 찾을 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 
"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

export function MintTokens() {
  const { address, isConnected } = useAccount();
  const [mintAmount, setMintAmount] = useState("100");

  const chainId = 31337; // Local chain
  const contracts = deployedContracts[chainId];

  // Get MDT balance
  const { data: mdtBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.MdtToken?.address,
    abi: contracts?.MdtToken?.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get token owner
  const { data: tokenOwner } = useReadContract({
    address: contracts?.MdtToken?.address,
    abi: contracts?.MdtToken?.abi,
    functionName: "owner",
  });

  // Mint tokens
  const {
    writeContract: mint,
    data: mintHash,
    isPending: isMinting,
  } = useWriteContract();

  // Wait for mint transaction
  const { isLoading: isMintLoading, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Refetch balance on success
  if (isMintSuccess) {
    refetchBalance();
    notification.success(`Successfully minted ${mintAmount} MDT tokens!`);
  }

  const handleMint = () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    const amount = parseEther(mintAmount);

    try {
      notification.info("Minting MDT tokens...");
      mint({
        address: contracts.MdtToken.address,
        abi: contracts.MdtToken.abi,
        functionName: "mint",
        args: [address, amount],
      });
    } catch (error) {
      console.error("Minting error:", error);
      notification.error("Failed to mint tokens");
    }
  };

  if (!isConnected) {
    return (
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <p className="text-center text-gray-700">Please connect your wallet to mint test tokens</p>
        </div>
      </div>
    );
  }

  const isOwner = tokenOwner === address;

  return (
    <div className="card bg-white shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-gray-900">Get Test MDT Tokens</h2>
        
        <div className="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>This is for testing only. In production, tokens would be purchased or earned.</span>
        </div>

        <div className="stat bg-white border border-gray-200 rounded-lg mb-4">
          <div className="stat-title text-gray-600">Your MDT Balance</div>
          <div className="stat-value text-2xl font-bold text-gray-900">
            {mdtBalance ? formatEther(mdtBalance) : "0"} MDT
          </div>
        </div>

        {isOwner ? (
          <>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-700">Amount to Mint</span>
              </label>
              <input
                type="number"
                placeholder="100"
                className="input input-bordered"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                disabled={isMinting || isMintLoading}
                min="1"
                max="1000"
              />
            </div>

            <button
              className={`btn btn-primary w-full ${isMinting || isMintLoading ? "loading" : ""}`}
              onClick={handleMint}
              disabled={isMinting || isMintLoading}
            >
              {isMinting || isMintLoading ? "Minting..." : `Mint ${mintAmount} MDT`}
            </button>
          </>
        ) : (
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Only the contract owner can mint tokens. Contact the admin for test tokens.</span>
          </div>
        )}

        <div className="divider">Quick Actions</div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setMintAmount("10")}
            disabled={!isOwner}
          >
            10 MDT (Min Stake)
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setMintAmount("100")}
            disabled={!isOwner}
          >
            100 MDT
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setMintAmount("500")}
            disabled={!isOwner}
          >
            500 MDT
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setMintAmount("1000")}
            disabled={!isOwner}
          >
            1000 MDT
          </button>
        </div>
      </div>
    </div>
  );
}
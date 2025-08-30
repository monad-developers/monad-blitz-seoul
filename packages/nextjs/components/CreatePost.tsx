"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

const BOND_AMOUNT = parseEther("0.1"); // 0.1 MDT per post

export function CreatePost() {
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chainId = 31337; // Local chain, update for production
  const contracts = deployedContracts[chainId];

  // Get user's MDT balance
  const { data: mdtBalance } = useReadContract({
    address: contracts?.MdtToken?.address,
    abi: contracts?.MdtToken?.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get user's stake in StakingVault
  const { data: userStake } = useReadContract({
    address: contracts?.StakingVault?.address,
    abi: contracts?.StakingVault?.abi,
    functionName: "getUserStake",
    args: address ? [address] : undefined,
  });

  // Approve MDT spending
  const { 
    writeContract: approve,
    data: approveHash,
    isPending: isApproving 
  } = useWriteContract();

  // Publish content
  const { 
    writeContract: publish,
    data: publishHash,
    isPending: isPublishing 
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isApprovalLoading } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Wait for publish transaction
  const { isLoading: isPublishLoading, isSuccess: isPublishSuccess } = useWaitForTransactionReceipt({
    hash: publishHash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!title || !content) {
      notification.error("Please fill in all fields");
      return;
    }

    // Check if user has enough MDT
    if (!mdtBalance || mdtBalance < BOND_AMOUNT) {
      notification.error(`Insufficient MDT balance. You need at least 0.1 MDT to post.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Store content in backend
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          author: address,
          contentType: "post",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to store content");
      }

      const { contentHash, uri } = await response.json();
      notification.info("Content stored off-chain. Publishing on-chain...");

      // Step 2: Approve MDT spending by StakingVault
      approve({
        address: contracts.MdtToken.address,
        abi: contracts.MdtToken.abi,
        functionName: "approve",
        args: [contracts.StakingVault.address, BOND_AMOUNT],
      });

      // Wait for approval
      while (isApprovalLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Step 3: Deposit MDT to StakingVault if needed
      const currentStake = userStake || BigInt(0);
      if (currentStake < BOND_AMOUNT) {
        const depositAmount = BOND_AMOUNT - currentStake;
        approve({
          address: contracts.StakingVault.address,
          abi: contracts.StakingVault.abi,
          functionName: "deposit",
          args: [depositAmount],
        });
      }

      // Step 4: Publish content on-chain
      publish({
        address: contracts.ContentRegistry.address,
        abi: contracts.ContentRegistry.abi,
        functionName: "publish",
        args: [contentHash as `0x${string}`, BOND_AMOUNT, uri],
      });

      // Wait for publish transaction
      while (isPublishLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (isPublishSuccess) {
        notification.success("Post published successfully!");
        setTitle("");
        setContent("");
      }
    } catch (error) {
      console.error("Error publishing post:", error);
      notification.error("Failed to publish post");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <p className="text-center">Please connect your wallet to create a post</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Create New Post</h2>
        
        <div className="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Each post requires a 0.1 MDT bond (withdrawable after 7 days if not challenged)</span>
        </div>

        {mdtBalance && (
          <div className="stats shadow mb-4">
            <div className="stat">
              <div className="stat-title">Your MDT Balance</div>
              <div className="stat-value text-primary">{formatEther(mdtBalance)} MDT</div>
            </div>
            {userStake && (
              <div className="stat">
                <div className="stat-title">Staked MDT</div>
                <div className="stat-value text-secondary">{formatEther(userStake)} MDT</div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              placeholder="Enter post title"
              className="input input-bordered"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Content</span>
            </label>
            <textarea
              placeholder="Write your post content here..."
              className="textarea textarea-bordered h-32"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              maxLength={5000}
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary w-full ${isSubmitting ? "loading" : ""}`}
            disabled={isSubmitting || isApproving || isPublishing}
          >
            {isApproving ? "Approving MDT..." : 
             isPublishing ? "Publishing..." : 
             isSubmitting ? "Processing..." : 
             "Publish Post (0.1 MDT Bond)"}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { useCallback, useEffect, useState } from "react";
import deployedContracts from "~~/contracts/deployedContracts";
import { notification } from "~~/utils/scaffold-eth";

const contracts = deployedContracts[31337];

export const useMonaddit = () => {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  // MDT Token hooks
  const { data: mdtBalance } = useReadContract({
    address: contracts.MdtToken.address,
    abi: contracts.MdtToken.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { writeContract: mintMdt, data: mintHash } = useWriteContract();
  const { isLoading: isMinting, isSuccess: mintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // StakingVault hooks
  const { data: stakeInfo } = useReadContract({
    address: contracts.StakingVault.address,
    abi: contracts.StakingVault.abi,
    functionName: "getStakeInfo",
    args: address ? [address] : undefined,
  });

  const { writeContract: approve } = useWriteContract();
  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { isLoading: isDepositing, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { writeContract: withdrawFromVault, data: withdrawVaultHash } = useWriteContract();
  const { isLoading: isWithdrawingVault, isSuccess: withdrawVaultSuccess } = useWaitForTransactionReceipt({
    hash: withdrawVaultHash,
  });

  // ContentRegistry hooks
  const { writeContract: publishContent, data: publishHash } = useWriteContract();
  const { isLoading: isPublishing, isSuccess: publishSuccess } = useWaitForTransactionReceipt({
    hash: publishHash,
  });

  const { writeContract: withdrawBond, data: withdrawHash } = useWriteContract();
  const { isLoading: isWithdrawing, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // ReputationSBT hooks
  const { data: hasSBT } = useReadContract({
    address: contracts.ReputationSBT.address,
    abi: contracts.ReputationSBT.abi,
    functionName: "hasSBT",
    args: address ? [address] : undefined,
  });

  const { data: reputation } = useReadContract({
    address: contracts.ReputationSBT.address,
    abi: contracts.ReputationSBT.abi,
    functionName: "getReputation",
    args: address ? [address] : undefined,
  });

  const { writeContract: mintSBT, data: mintSBTHash } = useWriteContract();
  const { isLoading: isMintingSBT, isSuccess: mintSBTSuccess } = useWaitForTransactionReceipt({
    hash: mintSBTHash,
  });

  // StakingRewards hooks
  const { data: pendingRewards } = useReadContract({
    address: contracts.StakingRewards.address,
    abi: contracts.StakingRewards.abi,
    functionName: "pendingRewards",
    args: address ? [address] : undefined,
  });

  const { writeContract: claimRewards, data: claimHash } = useWriteContract();
  const { isLoading: isClaiming, isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Helper functions
  const mintTokens = useCallback(async (amount: string) => {
    try {
      setIsProcessing(true);
      mintMdt({
        address: contracts.MdtToken.address,
        abi: contracts.MdtToken.abi,
        functionName: "mint",
        args: [address, parseEther(amount)],
      });
    } catch (error) {
      console.error("Error minting tokens:", error);
      notification.error("Failed to mint tokens");
    } finally {
      setIsProcessing(false);
    }
  }, [address, mintMdt]);

  const stakeTokens = useCallback(async (amount: string) => {
    try {
      setIsProcessing(true);
      // First approve
      await approve({
        address: contracts.MdtToken.address,
        abi: contracts.MdtToken.abi,
        functionName: "approve",
        args: [contracts.StakingVault.address, parseEther(amount)],
      });
      
      // Then deposit
      setTimeout(() => {
        deposit({
          address: contracts.StakingVault.address,
          abi: contracts.StakingVault.abi,
          functionName: "deposit",
          args: [parseEther(amount)],
        });
      }, 1000);
    } catch (error) {
      console.error("Error staking tokens:", error);
      notification.error("Failed to stake tokens");
    } finally {
      setIsProcessing(false);
    }
  }, [approve, deposit]);

  const withdrawStake = useCallback(async (amount: string) => {
    try {
      setIsProcessing(true);
      withdrawFromVault({
        address: contracts.StakingVault.address,
        abi: contracts.StakingVault.abi,
        functionName: "withdraw",
        args: [parseEther(amount)],
      });
    } catch (error) {
      console.error("Error withdrawing stake:", error);
      notification.error("Failed to withdraw stake");
    } finally {
      setIsProcessing(false);
    }
  }, [withdrawFromVault]);

  const createPost = useCallback(async (contentHash: string, contentUri: string) => {
    try {
      setIsProcessing(true);
      const bondAmount = parseEther("0.1"); // 0.1 tMDT bond
      
      publishContent({
        address: contracts.ContentRegistry.address,
        abi: contracts.ContentRegistry.abi,
        functionName: "publish",
        args: [contentHash as `0x${string}`, bondAmount, contentUri],
      });
    } catch (error) {
      console.error("Error publishing content:", error);
      notification.error("Failed to publish content");
    } finally {
      setIsProcessing(false);
    }
  }, [publishContent]);

  const withdrawContentBond = useCallback(async (contentId: bigint) => {
    try {
      setIsProcessing(true);
      withdrawBond({
        address: contracts.ContentRegistry.address,
        abi: contracts.ContentRegistry.abi,
        functionName: "withdrawBond",
        args: [contentId],
      });
    } catch (error) {
      console.error("Error withdrawing bond:", error);
      notification.error("Failed to withdraw bond");
    } finally {
      setIsProcessing(false);
    }
  }, [withdrawBond]);

  const createProfile = useCallback(async () => {
    try {
      setIsProcessing(true);
      mintSBT({
        address: contracts.ReputationSBT.address,
        abi: contracts.ReputationSBT.abi,
        functionName: "mint",
        args: [address],
      });
    } catch (error) {
      console.error("Error creating profile:", error);
      notification.error("Failed to create profile");
    } finally {
      setIsProcessing(false);
    }
  }, [address, mintSBT]);

  const claim = useCallback(async () => {
    try {
      setIsProcessing(true);
      claimRewards({
        address: contracts.StakingRewards.address,
        abi: contracts.StakingRewards.abi,
        functionName: "claim",
      });
    } catch (error) {
      console.error("Error claiming rewards:", error);
      notification.error("Failed to claim rewards");
    } finally {
      setIsProcessing(false);
    }
  }, [claimRewards]);

  // Show notifications on success
  useEffect(() => {
    if (mintSuccess) notification.success("Tokens minted successfully!");
    if (depositSuccess) notification.success("Tokens staked successfully!");
    if (withdrawVaultSuccess) notification.success("Stake withdrawn successfully!");
    if (publishSuccess) notification.success("Content published successfully!");
    if (withdrawSuccess) notification.success("Bond withdrawn successfully!");
    if (mintSBTSuccess) notification.success("Profile created successfully!");
    if (claimSuccess) notification.success("Rewards claimed successfully!");
  }, [mintSuccess, depositSuccess, withdrawVaultSuccess, publishSuccess, withdrawSuccess, mintSBTSuccess, claimSuccess]);

  return {
    // State
    mdtBalance: mdtBalance ? formatEther(mdtBalance as bigint) : "0",
    stakeInfo: stakeInfo ? {
      totalAmount: formatEther((stakeInfo as any)[0]),
      available: formatEther((stakeInfo as any)[1]),
      reserved: formatEther((stakeInfo as any)[2]),
      slashed: formatEther((stakeInfo as any)[3]),
      lastStakeTime: (stakeInfo as any)[4],
    } : null,
    hasSBT: hasSBT as boolean || false,
    reputation: reputation ? {
      karma: (reputation as any)[0],
      disputeCount: (reputation as any)[1],
    } : null,
    pendingRewards: pendingRewards ? formatEther(pendingRewards as bigint) : "0",
    
    // Loading states
    isProcessing: isProcessing || isMinting || isDepositing || isWithdrawingVault || isPublishing || isWithdrawing || isMintingSBT || isClaiming,
    
    // Functions
    mintTokens,
    stakeTokens,
    withdrawStake,
    createPost,
    withdrawContentBond,
    createProfile,
    claim,
  };
};

// Hook for backend API interactions
export const useBackendAPI = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  
  // Use relative URLs for Next.js API routes
  const saveContent = useCallback(async (content: {
    title: string;
    body: string;
    author: string;
    community?: string;
    tags?: string[];
    contentType?: string;
    parent_id?: string;
  }) => {
    try {
      const response = await fetch(`/api/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error saving content:", error);
      throw error;
    }
  }, []);

  const getContent = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/content/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch content");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching content:", error);
      throw error;
    }
  }, []);

  const listContents = useCallback(async (limit = 20, offset = 0) => {
    try {
      const response = await fetch(`/api/content?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch contents");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching contents:", error);
      throw error;
    }
  }, []);

  const scoreContent = useCallback(async (contentId: string) => {
    try {
      const response = await fetch(`/api/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content_id: contentId }),
      });

      if (!response.ok) {
        throw new Error("Failed to score content");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error scoring content:", error);
      throw error;
    }
  }, []);

  return {
    saveContent,
    getContent,
    listContents,
    scoreContent,
  };
};
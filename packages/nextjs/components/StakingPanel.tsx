"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";

const MINIMUM_STAKE = parseEther("10"); // 10 MDT minimum

export function StakingPanel() {
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "withdraw">("stake");

  const chainId = 31337; // Local chain, update for production
  const contracts = deployedContracts[chainId];

  // Get MDT balance
  const { data: mdtBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.MdtToken?.address,
    abi: contracts?.MdtToken?.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Get stake info
  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: contracts?.StakingVault?.address,
    abi: contracts?.StakingVault?.abi,
    functionName: "getStakeInfo",
    args: address ? [address] : undefined,
  });

  // Check if user is eligible staker
  const { data: isEligible } = useReadContract({
    address: contracts?.StakingVault?.address,
    abi: contracts?.StakingVault?.abi,
    functionName: "isEligibleStaker",
    args: address ? [address] : undefined,
  });

  // Approve MDT spending
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  // Deposit to staking vault
  const {
    writeContract: deposit,
    data: depositHash,
    isPending: isDepositing,
  } = useWriteContract();

  // Withdraw from staking vault
  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: isWithdrawing,
  } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isApprovalLoading, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Wait for deposit transaction
  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Wait for withdraw transaction
  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // Refetch balances on success
  useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess) {
      refetchBalance();
      refetchStakeInfo();
      setStakeAmount("");
      setWithdrawAmount("");
      
      if (isDepositSuccess) {
        notification.success("Successfully staked MDT tokens!");
      } else if (isWithdrawSuccess) {
        notification.success("Successfully withdrawn MDT tokens!");
      }
    }
  }, [isDepositSuccess, isWithdrawSuccess, refetchBalance, refetchStakeInfo]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    const amount = parseEther(stakeAmount);
    
    // Check minimum stake requirement
    const currentStake = stakeInfo ? BigInt(stakeInfo[0]) : BigInt(0);
    const newTotalStake = currentStake + amount;
    
    if (newTotalStake < MINIMUM_STAKE) {
      notification.error("Total stake must be at least 10 MDT");
      return;
    }

    // Check balance (mdtBalance is a BigInt)
    if (!mdtBalance || BigInt(mdtBalance) < amount) {
      notification.error("Insufficient MDT balance");
      return;
    }

    try {
      // Step 1: Approve MDT spending
      notification.info("Approving MDT spending...");
      approve({
        address: contracts.MdtToken.address,
        abi: contracts.MdtToken.abi,
        functionName: "approve",
        args: [contracts.StakingVault.address, amount],
      });
    } catch (error) {
      console.error("Approval error:", error);
      notification.error("Failed to approve MDT spending");
    }
  };

  // After approval success, deposit
  useEffect(() => {
    if (isApprovalSuccess && stakeAmount && activeTab === "stake") {
      const amount = parseEther(stakeAmount);
      notification.info("Depositing MDT to staking vault...");
      deposit({
        address: contracts.StakingVault.address,
        abi: contracts.StakingVault.abi,
        functionName: "deposit",
        args: [amount],
      });
    }
  }, [isApprovalSuccess, stakeAmount, activeTab, deposit, contracts]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      notification.error("Please enter a valid amount");
      return;
    }

    const amount = parseEther(withdrawAmount);
    
    // Check available balance
    const available = stakeInfo ? BigInt(stakeInfo[1]) : BigInt(0);
    if (amount > available) {
      notification.error("Insufficient available balance");
      return;
    }

    // Check minimum stake requirement after withdrawal
    const totalStaked = stakeInfo ? BigInt(stakeInfo[0]) : BigInt(0);
    const remainingStake = totalStaked - amount;
    
    if (remainingStake > 0 && remainingStake < MINIMUM_STAKE) {
      notification.error("Withdrawal would leave stake below 10 MDT minimum. Withdraw all or maintain at least 10 MDT.");
      return;
    }

    try {
      notification.info("Withdrawing MDT from staking vault...");
      withdraw({
        address: contracts.StakingVault.address,
        abi: contracts.StakingVault.abi,
        functionName: "withdraw",
        args: [amount],
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      notification.error("Failed to withdraw MDT");
    }
  };

  const formatStakeAge = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    if (days < 1) return "< 1 day";
    return `${Math.floor(days)} days`;
  };

  if (!isConnected) {
    return (
      <div className="card bg-white shadow-xl">
        <div className="card-body">
          <p className="text-center text-gray-700">Please connect your wallet to stake MDT</p>
        </div>
      </div>
    );
  }

  const totalStaked = stakeInfo ? stakeInfo[0] : BigInt(0);
  const availableStake = stakeInfo ? stakeInfo[1] : BigInt(0);
  const lockedStake = stakeInfo ? stakeInfo[2] : BigInt(0);
  const stakeAge = stakeInfo ? stakeInfo[4] : BigInt(0);

  return (
    <div className="card bg-white shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-gray-900">MDT Staking Vault</h2>

        {/* Balance Display */}
        <div className="stats bg-white border border-gray-200 shadow mb-4">
          <div className="stat">
            <div className="stat-title text-gray-600">Wallet Balance</div>
            <div className="stat-value text-lg font-bold text-gray-900">
              {mdtBalance ? formatEther(mdtBalance) : "0"} MDT
            </div>
          </div>
          <div className="stat">
            <div className="stat-title text-gray-600">Total Staked</div>
            <div className="stat-value text-lg font-bold text-gray-900">
              {formatEther(totalStaked)} MDT
            </div>
            <div className="stat-desc text-gray-500">
              Available: {formatEther(availableStake)} | Locked: {formatEther(lockedStake)}
            </div>
          </div>
        </div>

        {/* Staking Status */}
        {totalStaked > 0 && (
          <div className="alert alert-info mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <p>Stake Age: {formatStakeAge(stakeAge)}</p>
              <p>Eligible for rewards: {isEligible ? "Yes ✅" : "No (7 days required)"}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed bg-gray-100 mb-4">
          <a 
            className={`tab ${activeTab === "stake" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("stake")}
          >
            Stake MDT
          </a>
          <a 
            className={`tab ${activeTab === "withdraw" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw MDT
          </a>
        </div>

        {/* Stake Tab */}
        {activeTab === "stake" && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-700">Amount to Stake</span>
                <span className="label-text-alt text-gray-500">Min: 10 MDT</span>
              </label>
              <input
                type="number"
                placeholder="10"
                className="input input-bordered bg-white border-gray-300 text-gray-900 focus:border-gray-500"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={isApproving || isDepositing}
                min="0"
                step="0.1"
              />
            </div>

            <button
              className={`btn btn-primary w-full ${(stakeAmount && parseFloat(stakeAmount) > 0) ? "text-white" : "text-gray-900"} ${isApproving || isDepositing ? "loading" : ""}`}
              onClick={handleStake}
              disabled={
                isApproving || 
                isDepositing || 
                isApprovalLoading || 
                isDepositLoading ||
                !stakeAmount ||
                parseFloat(stakeAmount) <= 0
              }
            >
              {isApproving || isApprovalLoading ? "Approving..." :
               isDepositing || isDepositLoading ? "Staking..." :
               "Stake MDT"}
            </button>

            {totalStaked === BigInt(0) && (
              <div className="alert">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Stake at least 10 MDT to participate in the platform!</span>
              </div>
            )}
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === "withdraw" && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-700">Amount to Withdraw</span>
                <span className="label-text-alt text-gray-500">Available: {formatEther(availableStake)} MDT</span>
              </label>
              <input
                type="number"
                placeholder="0"
                className="input input-bordered bg-white border-gray-300 text-gray-900 focus:border-gray-500"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isWithdrawing || availableStake === BigInt(0)}
                min="0"
                step="0.1"
                max={formatEther(availableStake)}
              />
            </div>

            <button
              className={`btn btn-warning w-full ${(withdrawAmount && parseFloat(withdrawAmount) > 0) ? "text-white" : "text-gray-900"} ${isWithdrawing ? "loading" : ""}`}
              onClick={handleWithdraw}
              disabled={
                isWithdrawing || 
                isWithdrawLoading ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                availableStake === BigInt(0)
              }
            >
              {isWithdrawing || isWithdrawLoading ? "Withdrawing..." : "Withdraw MDT"}
            </button>

            {lockedStake > BigInt(0) && (
              <div className="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{formatEther(lockedStake)} MDT is locked for content bonds</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
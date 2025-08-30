"use client";

import { StakingPanel } from "~~/components/StakingPanel";
import { useAccount } from "wagmi";

export default function StakingPage() {
  const { isConnected } = useAccount();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">MDT Staking</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Stake your MDT tokens to participate in the Monaddit platform
        </p>
      </div>

      {!isConnected && (
        <div className="alert alert-warning mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Please connect your wallet to access staking features</span>
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <StakingPanel />
        </div>
      </div>

      {/* Staking Information */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white shadow border border-gray-200">
          <div className="card-body">
            <h3 className="card-title text-sm text-gray-700">Minimum Stake</h3>
            <p className="text-2xl font-bold text-gray-900">10 MDT</p>
            <p className="text-xs text-gray-500">Required to participate</p>
          </div>
        </div>
        <div className="card bg-white shadow border border-gray-200">
          <div className="card-body">
            <h3 className="card-title text-sm text-gray-700">Stake Eligibility</h3>
            <p className="text-2xl font-bold text-gray-900">7 Days</p>
            <p className="text-xs text-gray-500">Minimum stake age for rewards</p>
          </div>
        </div>
        <div className="card bg-white shadow border border-gray-200">
          <div className="card-body">
            <h3 className="card-title text-sm text-gray-700">Max Slashing</h3>
            <p className="text-2xl font-bold text-gray-900">20%</p>
            <p className="text-xs text-gray-500">Per incident cap</p>
          </div>
        </div>
      </div>
    </div>
  );
}
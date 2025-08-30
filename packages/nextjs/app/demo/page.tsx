"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { MintTokens } from "~~/components/MintTokens";
import { StakingPanel } from "~~/components/StakingPanel";
import { CreatePost } from "~~/components/CreatePost";
import { PostList } from "~~/components/PostList";

export default function DemoPage() {
  const { isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, name: "Get MDT Tokens", description: "Mint test tokens for demo" },
    { id: 2, name: "Stake 10 MDT", description: "Minimum stake to participate" },
    { id: 3, name: "Create Post", description: "0.1 MDT bond per post" },
    { id: 4, name: "View Posts", description: "Browse and interact" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4">
          Monaddit Demo
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          실명제는 의미 없다. 익명성은 지키면서 — 스테이킹이 진짜 책임을 만든다.
        </p>
      </div>

      {/* Connection Alert */}
      {!isConnected && (
        <div className="alert alert-warning mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Please connect your wallet to start the demo</span>
        </div>
      )}

      {/* Progress Steps */}
      {isConnected && (
        <div className="mb-8">
          <ul className="steps steps-horizontal w-full">
            {steps.map((step) => (
              <li
                key={step.id}
                className={`step ${currentStep >= step.id ? "step-primary" : ""}`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className="text-left ml-2">
                  <div className="text-sm font-semibold">{step.name}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Mint Tokens */}
        <div className={`${currentStep === 1 ? "lg:col-span-3" : ""}`}>
          {(currentStep === 1 || currentStep > 1) && (
            <div className={currentStep === 1 ? "" : "opacity-60"}>
              <MintTokens />
            </div>
          )}
        </div>

        {/* Step 2: Staking */}
        {currentStep >= 2 && (
          <div className={`${currentStep === 2 ? "lg:col-span-3" : "lg:col-span-1"}`}>
            <div className={currentStep === 2 ? "" : "opacity-60"}>
              <StakingPanel />
            </div>
          </div>
        )}

        {/* Step 3: Create Post */}
        {currentStep >= 3 && (
          <div className={`${currentStep === 3 ? "lg:col-span-3" : "lg:col-span-1"}`}>
            <div className={currentStep === 3 ? "" : "opacity-60"}>
              <CreatePost />
            </div>
          </div>
        )}

        {/* Step 4: View Posts */}
        {currentStep >= 4 && (
          <div className={`${currentStep === 4 ? "lg:col-span-3" : "lg:col-span-1"}`}>
            <div className="card bg-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-gray-900">Community Posts</h2>
                <PostList />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {isConnected && (
        <div className="flex justify-between mt-8">
          <button
            className="btn btn-outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous Step
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
            disabled={currentStep === 4}
          >
            Next Step
          </button>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="card bg-white shadow border border-gray-200">
          <div className="card-body">
            <h3 className="card-title text-sm text-gray-700">Economic Security</h3>
            <p className="text-xs text-gray-600">
              Every post requires 0.1 MDT bond. Bad content = bond slashed.
            </p>
          </div>
        </div>
        <div className="card bg-white shadow border border-gray-200">
          <div className="card-body">
            <h3 className="card-title text-sm text-gray-700">Community Moderation</h3>
            <p className="text-xs text-gray-600">
              Users can challenge content. Jury votes decide the outcome.
            </p>
          </div>
        </div>
        <div className="card bg-white shadow border border-gray-200">
          <div className="card-body">
            <h3 className="card-title text-sm text-gray-700">Reward System</h3>
            <p className="text-xs text-gray-600">
              Good behavior earns rewards from the staking pool.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useState } from "react";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { TokenMinter } from "~~/components/TokenMinter";
import { TokenDeposit } from "~~/components/TokenDeposit";
import { TokenRedeem } from "~~/components/TokenRedeem";
import { TokenBalanceTable } from "~~/components/TokenBalanceTable";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState("deposit");

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        {/* Token Mint Section */}
        <div className="mt-8 mb-8">
          <TokenMinter />
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="tabs tabs-boxed">
              <button
                className={`tab ${activeTab === "deposit" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("deposit")}
              >
                토큰 Deposit
              </button>
              <button
                className={`tab ${activeTab === "redeem" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("redeem")}
              >
                토큰 Redeem
              </button>
              <button
                className={`tab ${activeTab === "balance" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("balance")}
              >
                토큰 보유량
              </button>
            </div>
          </div>

          <div className="flex justify-center items-center gap-12 flex-col md:flex-row">
            {activeTab === "deposit" && <TokenDeposit />}
            {activeTab === "redeem" && <TokenRedeem />}
            {activeTab === "balance" && <TokenBalanceTable />}
            
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Tinker with your smart contract using the{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>{" "}
                tab.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Explore your local transactions with the{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>{" "}
                tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

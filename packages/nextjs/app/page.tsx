
"use client";

import { useAccount } from "wagmi";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { hardhat } from "viem/chains";
import Link from "next/link";
import { TicketIcon, BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";


const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  return (
    <>
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6E54FF]/10 via-transparent to-[#85E6FF]/10"></div>
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-[#6E54FF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-[#85E6FF]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF8EE4]/10 rounded-full blur-3xl"></div>

        <div className="flex items-center flex-col grow pt-20 relative z-10">
          <div className="px-5 mb-12">
            <h1 className="text-center mb-8">
              <span className="block text-2xl mb-4 font-mono text-base-content/70">Welcome to</span>
              <span className="block text-6xl md:text-7xl font-bold monad-gradient-text font-mono mb-6">
                Monad Ticket Platform
              </span>
              <p className="text-lg text-base-content/70 font-mono max-w-2xl mx-auto">
                Experience the future of event ticketing on the Monad blockchain
              </p>
            </h1>
            <div className="flex justify-center items-center space-x-2 flex-col glass-card-strong p-6 max-w-md mx-auto monad-glow">
              <p className="my-2 font-medium font-mono">Connected Address:</p>
              <Address
                address={connectedAddress}
                chain={targetNetwork}
                blockExplorerAddressLink={
                  targetNetwork.id === hardhat.id ? `/blockexplorer/address/${connectedAddress}` : undefined
                }
              />
            </div>
          </div>

          <div className="w-full mt-16 px-8 py-16">
            <div className="flex justify-center items-stretch gap-8 flex-col md:flex-row max-w-6xl mx-auto">
              <div className="flex flex-col glass-card-strong px-10 py-10 text-center items-center flex-1 group hover:monad-glow transition-all">
                <TicketIcon className="h-12 w-12 text-[#6E54FF] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold monad-gradient-text font-mono mb-3">Events</h3>
                <p className="font-mono text-sm mb-4 text-base-content/80">
                  Browse and book tickets for amazing events on the blockchain
                </p>
                <Link
                  href="/events"
                  className="btn monad-gradient text-white border-none font-mono mt-auto hover:monad-glow-strong"
                >
                  Explore Events
                </Link>
              </div>
              <div className="flex flex-col glass-card-strong px-10 py-10 text-center items-center flex-1 group hover:monad-glow transition-all">
                <BugAntIcon className="h-12 w-12 text-[#85E6FF] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold monad-gradient-text font-mono mb-3">Debug Contracts</h3>
                <p className="font-mono text-sm mb-4 text-base-content/80">
                  Tinker with your smart contracts and test functionality
                </p>
                <Link
                  href="/debug"
                  className="btn glass-button font-mono mt-auto hover:bg-[#85E6FF]/30"
                >
                  Debug Contracts
                </Link>
              </div>
              <div className="flex flex-col glass-card-strong px-10 py-10 text-center items-center flex-1 group hover:monad-glow transition-all">
                <MagnifyingGlassIcon className="h-12 w-12 text-[#FFAE45] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold monad-gradient-text font-mono mb-3">Block Explorer</h3>
                <p className="font-mono text-sm mb-4 text-base-content/80">
                  Explore your local transactions and blockchain data
                </p>
                <Link
                  href="/blockexplorer"
                  className="btn glass-button font-mono mt-auto hover:bg-[#FFAE45]/30"
                >
                  Block Explorer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

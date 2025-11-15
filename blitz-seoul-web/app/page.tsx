"use client";

import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import { CharacterMenu } from "../components/character-menu";
import { useEffect, useState } from "react";
import { Address, createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { monCharacterAbi } from "../app/_abis/monCharacter";

const CHARACTER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARACTER_CONTRACT_ADDRESS;

export default function Home() {
  const { wallets } = useWallets();
  const { ready, authenticated, connectWallet, logout, unlinkWallet } =
    usePrivy();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const isWalletConnected = wallets.length > 0;

  const handleConnect = async () => {
    connectWallet({
      walletList: ["metamask"],
      description: "Connect your wallet to access the app",
    });
  };

  return (
    <main className="min-h-screen">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute z-30"
          style={{
            top: "64%",
            left: "52%",
            transform: "translate(-50%, -50%) translate(23px, 149px)",
          }}
        >
          <span className="absolute inline-flex h-full w-full rounded-[10px] bg-yellow-200 opacity-50 animate-ping duration-3000 blur-sm"></span>
          <button
            onClick={handleConnect}
            className="relative px-3 py-2 rounded-[10px] cursor-pointer hover:opacity-90 transition-all duration-200 active:translate-y-1 "
            style={{
              fontFamily: "'inter'",
              background: "linear-gradient(135deg, #ff6b6b 0%, #e64545 100%)",
              border: "2px solid #d1d1d1",
              boxShadow: `
        0 7px 14px rgba(0,0,0,0.35),   /* 더 깊은 메인 그림자 */
        inset 0 3px 6px rgba(255,255,255,0.45), /* 위쪽 강한 하이라이트 */
        inset 0 -4px 8px rgba(0,0,0,0.3)         /* 아래쪽 깊은 어두움 */
      `,
            }}
            aria-label="Connect Wallet"
          >
            <div className="text-white font-bold text-sm text-center leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.50)]">
              <p>Connect</p>
              <p>Wallet</p>
            </div>
          </button>
        </div>

        {isWalletConnected && (
          <div className="absolute top-4 right-4 z-40 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
            연결됨: {wallets[0]?.address}
          </div>
        )}

        <CharacterMenu />
      </section>
    </main>
  );
}

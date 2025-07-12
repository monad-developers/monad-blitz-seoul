"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { WalletConnectLogin } from "~~/components/scaffold-eth";

const LoginPage: NextPage = () => {
  const { isConnected, address } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) {
      router.push("/");
    }
  }, [isConnected, address, router]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-base-content">Connect Your Wallet</h2>
          <p className="mt-2 text-center text-sm text-base-content/70">Connect with WalletConnect to access the dApp</p>
        </div>

        <div className="bg-base-100 shadow-xl rounded-lg p-8">
          <WalletConnectLogin />
        </div>

        <div className="text-center">
          <div className="mt-6 p-4 bg-info/10 rounded-lg">
            <h3 className="text-lg font-medium text-info mb-2">What is WalletConnect?</h3>
            <p className="text-sm text-base-content/70">
              WalletConnect is an open protocol that securely connects your mobile or desktop wallet to dApps using QR
              codes or deep links. It supports over 300 wallets and provides end-to-end encryption for all
              communications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CheckCircleIcon, QrCodeIcon, WalletIcon } from "@heroicons/react/24/outline";

export const WalletConnectLogin = () => {
  const { isConnected, address } = useAccount();
  const [, setShowConnectModal] = useState(false);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircleIcon className="w-6 h-6 text-green-600" />
        <div>
          <span className="text-green-700 font-medium block">Wallet Connected!</span>
          <span className="text-green-600 text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Connect with WalletConnect</h3>
        <p className="text-gray-600 mb-4">Connect your mobile wallet or desktop wallet using WalletConnect protocol</p>
      </div>

      <div className="flex flex-col gap-3">
        <ConnectButton.Custom>
          {({ openConnectModal, connectModalOpen, mounted }) => {
            const ready = mounted;

            return (
              <>
                <button
                  onClick={() => {
                    openConnectModal();
                    setShowConnectModal(true);
                  }}
                  disabled={!ready}
                  className="flex items-center justify-center gap-3 w-full p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <QrCodeIcon className="w-5 h-5" />
                  Connect with WalletConnect
                </button>

                {connectModalOpen && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCodeIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Connection Modal Opened</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Choose WalletConnect from the list and scan the QR code with your mobile wallet app.
                    </p>
                  </div>
                )}
              </>
            );
          }}
        </ConnectButton.Custom>

        <div className="divider">OR</div>

        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button
              onClick={openConnectModal}
              disabled={!mounted}
              className="flex items-center justify-center gap-3 w-full p-4 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              <WalletIcon className="w-5 h-5" />
              View All Wallet Options
            </button>
          )}
        </ConnectButton.Custom>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">How to Connect with WalletConnect</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">1.</span>
            <span>Click &quot;Connect with WalletConnect&quot; button above</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">2.</span>
            <span>Select &quot;WalletConnect&quot; from the wallet options</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">3.</span>
            <span>Scan the QR code with your mobile wallet app</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-blue-600">4.</span>
            <span>Approve the connection in your wallet</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-medium mb-2 text-purple-800">🦄 Phantom Wallet</h4>
        <div className="space-y-2 text-sm text-purple-700">
          <p>Phantom is a popular Ethereum & Solana wallet. To connect with Phantom:</p>
          <div className="flex items-start gap-2">
            <span className="font-medium text-purple-600">1.</span>
            <span>
              Install Phantom from{" "}
              <a
                href="https://phantom.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-purple-900"
              >
                phantom.app
              </a>
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-purple-600">2.</span>
            <span>Click &quot;Connect with WalletConnect&quot; above</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-purple-600">3.</span>
            <span>Select &quot;WalletConnect&quot; from wallet options</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-purple-600">4.</span>
            <span>Scan QR code with Phantom mobile app or copy URL to Phantom browser extension</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Supported Wallets</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>• MetaMask Mobile</div>
          <div>• Phantom Wallet</div>
          <div>• Trust Wallet</div>
          <div>• Rainbow Wallet</div>
          <div>• Coinbase Wallet</div>
          <div>• WalletConnect v2</div>
          <div>• Ledger Wallet</div>
          <div>• 300+ other wallets</div>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, LogOut } from 'lucide-react';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        <div className="monad-glass px-3 py-2 rounded-lg">
          <div className="text-sm text-gray-200 font-mono">
            {formatAddress(address)}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-lg transition-all duration-200 backdrop-blur-sm"
        >
          <LogOut size={16} />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="flex items-center space-x-2 px-6 py-3 bg-monad-gradient hover:scale-105 text-white rounded-lg transition-all duration-200 font-medium monad-glow"
        >
          <Wallet size={16} />
          <span>{connector.name}</span>
        </button>
      ))}
    </div>
  );
}

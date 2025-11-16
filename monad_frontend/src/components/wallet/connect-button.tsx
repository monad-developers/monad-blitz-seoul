"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { shorten } from "@/lib/strings";

const ConnectButton = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  const { address, chainId, status } = useAccount();
  const { chains, switchChain, isPending: isSwitching } = useSwitchChain();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isClient) {
    return (
      <div className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-slate-400">
        Initializing wallet...
      </div>
    );
  }

  if (address) {
    const activeChain = chains.find((chain) => chain.id === chainId);
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-sm text-white">
        <span>{shorten(address)}</span>
        {activeChain ? (
          <button
            type="button"
            className="rounded-full bg-white/10 px-2 py-0.5 text-xs"
            onClick={() => switchChain({ chainId: activeChain.id })}
            disabled
          >
            {activeChain.name}
          </button>
        ) : (
          chains.map((chain) => (
            <button
              key={chain.id}
              type="button"
              className="rounded-full bg-white/10 px-2 py-0.5 text-xs"
              onClick={() => switchChain({ chainId: chain.id })}
              disabled={isSwitching}
            >
              {chain.name}
            </button>
          ))
        )}
        <button
          type="button"
          className="rounded-full bg-rose-500/80 px-3 py-0.5 text-xs font-semibold"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          type="button"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white hover:border-cyan-400"
          disabled={isPending}
          onClick={() => connect({ connector })}
        >
          {connector.name}
        </button>
      ))}
      <span className="text-xs text-slate-400">Status: {status}</span>
    </div>
  );
};

export { ConnectButton };

"use client";

import { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { nativeSymbolMap, usdcAddressMap } from "@/config/wallet-assets";

const WalletAssetOverview = () => {
  const { address, chainId, status } = useAccount();

  const nativeBalance = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address && chainId), refetchOnWindowFocus: false },
  });

  const usdcToken = chainId ? usdcAddressMap[chainId] : undefined;
  const usdcBalance = useBalance({
    address,
    chainId,
    token: usdcToken,
    query: { enabled: Boolean(address && usdcToken), refetchOnWindowFocus: false },
  });

  const assets = useMemo(() => {
    const entries = [] as Array<{ label: string; value: string; isLoading: boolean }>;
    const nativeSymbol = chainId ? nativeSymbolMap[chainId] ?? "ETH" : "ETH";
    entries.push({
      label: nativeSymbol,
      value: address ? `${nativeBalance.data?.formatted ?? "0"}` : "0",
      isLoading: nativeBalance.isLoading,
    });
    entries.push({
      label: "USDC",
      value: address ? `${usdcBalance.data?.formatted ?? "0"}` : "0",
      isLoading: usdcBalance.isLoading && Boolean(usdcToken),
    });
    return entries;
  }, [address, chainId, nativeBalance.data?.formatted, nativeBalance.isLoading, usdcBalance.data?.formatted, usdcBalance.isLoading, usdcToken]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
        <span className="uppercase tracking-[0.3em] text-cyan-200/80">Wallet</span>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px]">Status: {status}</span>
        {chainId ? <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px]">Chain ID: {chainId}</span> : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {assets.map((asset) => (
          <article key={asset.label} className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{asset.label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {asset.isLoading ? <span className="text-slate-500">Syncing...</span> : asset.value}
            </p>
          </article>
        ))}
      </div>
      {!address && (
        <p className="mt-3 text-xs text-slate-400">Connect a wallet to check balances across the supported testnets.</p>
      )}
    </div>
  );
};

export { WalletAssetOverview };

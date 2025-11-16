import { Suspense } from "react";
import { ConnectButton } from "@/components/wallet/connect-button";
import { WalletAssetOverview } from "@/components/wallet/asset-overview";
import { GrantForm } from "./grant-form";

const GrantConsole = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 text-white lg:py-16">
    <section className="space-y-4">
      <p className="text-sm uppercase tracking-[0.4em] text-cyan-200/80">Chainlink CCIP</p>
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Grant dispersal cockpit</h1>
      <p className="max-w-3xl text-base text-slate-300 sm:text-lg">Quote USD grants against Chainlink feeds, define CCIP routes, and prep deterministic multi-chain transfers without touching bespoke scripts.</p>
      <div className="space-y-4">
        <ConnectButton />
        <WalletAssetOverview />
      </div>
    </section>
    <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">Bootstrapping grant console...</div>}>
      <GrantForm />
    </Suspense>
  </div>
);

export { GrantConsole };

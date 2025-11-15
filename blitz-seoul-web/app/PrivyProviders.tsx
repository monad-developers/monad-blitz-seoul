"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { monadTestnet } from "viem/chains";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
const clientId = process.env.NEXT_PUBLIC_PRIVY_APP_CLIENT_ID;

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        defaultChain: monadTestnet,
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: [monadTestnet],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

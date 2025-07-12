"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { monadTestnet } from "wagmi/chains";
import {
  backpackWallet,
  coinbaseWallet,
  okxWallet,
  rabbyWallet,
  roninWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        rabbyWallet,
        roninWallet,
        okxWallet,
        coinbaseWallet,
        walletConnectWallet,
        backpackWallet,
      ],
    },
  ],
  {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "",
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID ?? "",
  },
);

export const config = createConfig({
  chains: [monadTestnet],
  connectors,
  transports: {
    [monadTestnet.id]: http(
      "https://monad-testnet.g.alchemy.com/v2/hfYErDbmcDbfKaLU9eA8Nma-EM_lXFHB",
    ),
  },
  ssr: true,
});

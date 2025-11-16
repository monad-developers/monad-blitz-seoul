import { createConfig, http } from "wagmi";
import { arbitrumSepolia, avalancheFuji, baseSepolia, optimismSepolia, sepolia } from "wagmi/chains";
import { coinbaseWallet, injected, metaMask } from "wagmi/connectors";

const transports = {
  [arbitrumSepolia.id]: http("https://arbitrum-sepolia.drpc.org"),
  [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
  [baseSepolia.id]: http("https://sepolia.base.org"),
  [sepolia.id]: http("https://api.zan.top/eth-sepolia"),
  [optimismSepolia.id]: http("https://sepolia.optimism.io"),
};

export const wagmiConfig = createConfig({
  chains: [sepolia, arbitrumSepolia, avalancheFuji, baseSepolia, optimismSepolia],
  connectors: [
    metaMask({
      dappMetadata: { name: "Monad CCIP Grants", description: "Grant dispersal cockpit" },
      shimDisconnect: true,
    }),
    coinbaseWallet({
      appName: "Monad CCIP Grants",
    }),
    injected({
      shimDisconnect: true,
      // Covers Rabby, Phantom (EVM) and other injected wallets.
    }),
  ],
  transports,
  ssr: false,
});

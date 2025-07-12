import * as chains from "viem/chains";
import { monadTestnet } from "~~/utils/scaffold-eth/monadChain";

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: process.env.NODE_ENV === "development" 
    ? [chains.hardhat, monadTestnet] 
    : [monadTestnet],
  // The interval at which your front-end polls the RPC servers for new data (it has no effect if you only target the local network (default is 4000))
  pollingInterval: 30000,
  // Custom RPC overrides for specific networks
  rpcOverrides: {
    [monadTestnet.id]: process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz/",
  },
  // WalletConnect Project ID
  // Get your own at https://cloud.walletconnect.com
  // It's recommended to store it in an env variable:
  // .env.local for local testing, and in the Vercel/system env config for live apps.
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;

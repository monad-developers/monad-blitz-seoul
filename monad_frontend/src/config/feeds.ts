import { AssetSymbol } from "@/config/assets";

export interface FeedConfig {
  readonly address: `0x${string}`;
  readonly decimals: number;
  readonly rpcUrl: string;
}

const MONAD_RPC = "https://testnet-rpc.monad.xyz";

export const feedMap: Record<AssetSymbol, FeedConfig> = {
  BTC: {
    address: "0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31",
    decimals: 8,
    rpcUrl: MONAD_RPC,
  },
  ETH: {
    address: "0x0c76859E85727683Eeba0C70Bc2e0F5781337818",
    decimals: 8,
    rpcUrl: MONAD_RPC,
  },
  LINK: {
    address: "0x4682035965Cd2B88759193ee2660d8A0766e1391",
    decimals: 8,
    rpcUrl: MONAD_RPC,
  },
  USDC: {
    address: "0x70BB0758a38ae43418ffcEd9A25273dd4e804D15",
    decimals: 8,
    rpcUrl: MONAD_RPC,
  },
  USDT: {
    address: "0x14eE6bE30A91989851Dc23203E41C804D4D71441",
    decimals: 8,
    rpcUrl: MONAD_RPC,
  },
};

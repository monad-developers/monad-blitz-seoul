export interface ChainConfig {
  readonly selector: string;
  readonly name: string;
  readonly router: string;
  readonly nativeSymbol: string;
  readonly explorerUrl: string;
  readonly receiver: string;
  readonly rpcUrl: string;
  readonly rpcEnv?: string;
}

export const chainCatalog: readonly ChainConfig[] = [
  {
    selector: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    router: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
    nativeSymbol: "ETH",
    explorerUrl: "https://sepolia.arbiscan.io",
    receiver: "0x0000000000000000000000000000000000000001",
    rpcUrl: "https://arbitrum-sepolia.drpc.org",
  },
  {
    selector: "avalanche-fuji",
    name: "Avalanche Fuji",
    router: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
    nativeSymbol: "AVAX",
    explorerUrl: "https://testnet.snowtrace.io",
    receiver: "0x0000000000000000000000000000000000000002",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  },
  {
    selector: "base-sepolia",
    name: "Base Sepolia",
    router: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
    nativeSymbol: "ETH",
    explorerUrl: "https://sepolia.basescan.org",
    receiver: "0x0000000000000000000000000000000000000003",
    rpcUrl: "https://sepolia.base.org",
  },
  {
    selector: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    nativeSymbol: "ETH",
    explorerUrl: "https://sepolia.etherscan.io",
    receiver: "0x0000000000000000000000000000000000000005",
    rpcUrl: "https://api.zan.top/eth-sepolia",
  },
  {
    selector: "op-sepolia",
    name: "OP Sepolia",
    router: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57",
    nativeSymbol: "ETH",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    receiver: "0x0000000000000000000000000000000000000007",
    rpcUrl: "https://sepolia.optimism.io",
  },
] as const;

export type ChainSelector = (typeof chainCatalog)[number]["selector"];

export const chainMap: Record<string, ChainConfig> = chainCatalog.reduce(
  (accumulator, chain) => ({ ...accumulator, [chain.selector]: chain }),
  {} as Record<string, ChainConfig>
);

export type AssetSymbol = "BTC" | "ETH" | "USDC" | "LINK" | "USDT";

export interface AssetConfig {
  readonly symbol: AssetSymbol;
  readonly label: string;
  readonly feedSlug: string;
  readonly feedDecimals: number;
  readonly tokenDecimals: number;
  readonly fallbackPrice: number;
  readonly accent: string;
}

export const assetCatalog: readonly AssetConfig[] = [
  {
    symbol: "USDC",
    label: "USD Coin",
    feedSlug: "ethereum-mainnet/usdc-usd",
    feedDecimals: 8,
    tokenDecimals: 6,
    fallbackPrice: 1,
    accent: "from-sky-500/80 via-cyan-500/70 to-blue-400/60",
  },
  {
    symbol: "USDT",
    label: "Tether",
    feedSlug: "tether-usd",
    feedDecimals: 8,
    tokenDecimals: 6,
    fallbackPrice: 1,
    accent: "from-lime-500/80 via-emerald-500/70 to-green-400/60",
  },
  {
    symbol: "ETH",
    label: "Ether",
    feedSlug: "ethereum-mainnet/eth-usd",
    feedDecimals: 8,
    tokenDecimals: 18,
    fallbackPrice: 3200,
    accent: "from-orange-500/80 via-amber-500/70 to-amber-300/60",
  },
  {
    symbol: "BTC",
    label: "Bitcoin",
    feedSlug: "bitcoin-usd",
    feedDecimals: 8,
    tokenDecimals: 8,
    fallbackPrice: 60000,
    accent: "from-amber-700/80 via-orange-500/70 to-yellow-400/60",
  },
  {
    symbol: "LINK",
    label: "Chainlink",
    feedSlug: "ethereum-mainnet/link-usd",
    feedDecimals: 8,
    tokenDecimals: 18,
    fallbackPrice: 17,
    accent: "from-indigo-500/80 via-blue-600/70 to-slate-500/60",
  },
] as const;

export const assetMap: Record<AssetSymbol, AssetConfig> = assetCatalog.reduce(
  (accumulator, asset) => ({ ...accumulator, [asset.symbol]: asset }),
  {} as Record<AssetSymbol, AssetConfig>
);

export const assetSymbols: readonly AssetSymbol[] = assetCatalog.map(
  (asset) => asset.symbol
) as AssetSymbol[];

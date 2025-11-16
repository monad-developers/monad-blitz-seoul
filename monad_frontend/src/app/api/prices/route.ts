import { NextRequest, NextResponse } from "next/server";
import { assetCatalog, AssetSymbol } from "@/config/assets";
import { feedMap } from "@/config/feeds";
import { getPublicClient } from "@/lib/viem";

const aggregatorAbi = [
  {
    name: "latestRoundData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

interface PricePayload {
  readonly symbol: AssetSymbol;
  readonly price: number;
  readonly updatedAt: string;
  readonly source: string;
  readonly isFallback: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get("symbols") ?? assetCatalog.map((asset) => asset.symbol).join(",");
  const requestedSymbols = symbolsParam.split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean);
  const validSymbols = Array.from(new Set(requestedSymbols)).filter((symbol): symbol is AssetSymbol => assetCatalog.some((asset) => asset.symbol === symbol));
  if (validSymbols.length === 0) {
    return NextResponse.json({ message: "No supported assets requested" }, { status: 400 });
  }
  const payloads = await Promise.all(validSymbols.map(async (symbol) => readOnchainPrice(symbol)));
  return NextResponse.json({ prices: payloads, timestamp: new Date().toISOString() });
}

async function readOnchainPrice(symbol: AssetSymbol): Promise<PricePayload> {
  const feedConfig = feedMap[symbol];
  if (!feedConfig) {
    return {
      symbol,
      price: 0,
      updatedAt: new Date().toISOString(),
      source: "missing-feed",
      isFallback: true,
    };
  }
  try {
    const client = getPublicClient("monad-feed", { url: feedConfig.rpcUrl });
    const [, answerRaw, , updatedAtRaw] = await client.readContract({
      address: feedConfig.address,
      abi: aggregatorAbi,
      functionName: "latestRoundData",
    });
    const answer = Number(answerRaw) / 10 ** feedConfig.decimals;
    const updatedAt = new Date(Number(updatedAtRaw) * 1000).toISOString();
    return {
      symbol,
      price: answer,
      updatedAt,
      source: feedConfig.address,
      isFallback: false,
    };
  } catch (error) {
    return {
      symbol,
      price: 0,
      updatedAt: new Date().toISOString(),
      source: "feed-error",
      isFallback: true,
    };
  }
}

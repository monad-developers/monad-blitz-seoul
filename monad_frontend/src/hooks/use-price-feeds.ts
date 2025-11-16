"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AssetSymbol } from "@/config/assets";

interface PricePoint {
  readonly symbol: AssetSymbol;
  readonly price: number;
  readonly updatedAt: string;
  readonly source: string;
  readonly isFallback: boolean;
}

interface PriceState {
  readonly points: readonly PricePoint[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

const INITIAL_STATE: PriceState = { points: [], isLoading: true, error: null };

export const usePriceFeeds = (symbols: readonly AssetSymbol[]) => {
  const [state, setState] = useState<PriceState>(INITIAL_STATE);
  const symbolsKey = symbols.join(",");
  const fetchPrices = useCallback(async () => {
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/prices?symbols=${symbolsKey}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load feeds (${response.status})`);
      }
      const json = await response.json();
      setState({ points: json.prices, isLoading: false, error: null });
    } catch (error) {
      setState({ points: [], isLoading: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  }, [symbolsKey]);
  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60000);
    return () => clearInterval(id);
  }, [fetchPrices]);
  const priceMap = useMemo(() => state.points.reduce<Record<AssetSymbol, PricePoint>>((accumulator, point) => ({ ...accumulator, [point.symbol]: point }), {} as Record<AssetSymbol, PricePoint>), [state.points]);
  return { priceMap, refresh: fetchPrices, ...state };
};

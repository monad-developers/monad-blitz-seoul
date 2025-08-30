'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { PRICE_FEEDS_ABI, PRICE_FEEDS_ADDRESS } from '../lib/contracts/PriceFeeds';

export interface PriceData {
  symbol: 'ETH' | 'BTC';
  price: number;
  timestamp: number;
  change24h: number;
  change24hPercent: number;
}

export const usePriceFeeds = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const fetchPrices = useCallback(async () => {
    if (!publicClient) {
      // 컨트랙트가 배포되지 않은 경우 mock 데이터 사용
      setPrices([
        {
          symbol: 'ETH',
          price: 2520,
          timestamp: Date.now(),
          change24h: 120,
          change24hPercent: 5.0,
        },
        {
          symbol: 'BTC',
          price: 65500,
          timestamp: Date.now(),
          change24h: 1500,
          change24hPercent: 2.34,
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // ETH 가격 가져오기
      const [ethPriceResult, btcPriceResult] = await Promise.all([
        publicClient.readContract({
          address: PRICE_FEEDS_ADDRESS as `0x${string}`,
          abi: PRICE_FEEDS_ABI,
          functionName: 'getETHPriceWithTimestamp',
        }),
        publicClient.readContract({
          address: PRICE_FEEDS_ADDRESS as `0x${string}`,
          abi: PRICE_FEEDS_ABI,
          functionName: 'getBTCPriceWithTimestamp',
        }),
      ]);

      const [ethPrice, ethTimestamp] = ethPriceResult as [bigint, bigint];
      const [btcPrice, btcTimestamp] = btcPriceResult as [bigint, bigint];

      // Chainlink 가격은 8 decimals를 사용
      const ethPriceFormatted = Number(ethPrice) / 1e8;
      const btcPriceFormatted = Number(btcPrice) / 1e8;

      // 이전 가격과 비교하여 변화량 계산 (임시로 랜덤 값 사용)
      const ethChange = Math.random() * 200 - 100; // -100 ~ +100
      const btcChange = Math.random() * 2000 - 1000; // -1000 ~ +1000

      setPrices([
        {
          symbol: 'ETH',
          price: ethPriceFormatted,
          timestamp: Number(ethTimestamp) * 1000,
          change24h: ethChange,
          change24hPercent: (ethChange / ethPriceFormatted) * 100,
        },
        {
          symbol: 'BTC',
          price: btcPriceFormatted,
          timestamp: Number(btcTimestamp) * 1000,
          change24h: btcChange,
          change24hPercent: (btcChange / btcPriceFormatted) * 100,
        },
      ]);

      setError(null);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError('Failed to fetch prices from contract');
      
      // 에러 시 mock 데이터 사용
      setPrices([
        {
          symbol: 'ETH',
          price: 2520,
          timestamp: Date.now(),
          change24h: 120,
          change24hPercent: 5.0,
        },
        {
          symbol: 'BTC',
          price: 65500,
          timestamp: Date.now(),
          change24h: 1500,
          change24hPercent: 2.34,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchPrices();

    // 5초마다 가격 업데이트
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, error, refetch: fetchPrices };
};
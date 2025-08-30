'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface PriceData {
  symbol: 'ETH' | 'BTC';
  price: number;
  change24h: number;
  change24hPercent: number;
}

interface PriceTickerProps {
  prices: PriceData[];
  lastUpdate: Date;
}

export const PriceTicker: React.FC<PriceTickerProps> = ({ prices, lastUpdate }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
  return (
    <Card className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Live Prices</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#4ADE80] rounded-full animate-pulse" />
          <span className="text-xs text-[#8B9299]">
            {mounted ? `Updated: ${formatTime(lastUpdate)}` : 'Loading...'}
          </span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {prices.map((price) => {
          const isPositive = price.change24hPercent >= 0;
          const icon = price.symbol === 'ETH' ? '🦄' : '🦁';
          const color = price.symbol === 'ETH' ? '#627EEA' : '#F7931A';
          
          return (
            <div
              key={price.symbol}
              className="bg-[#121619] rounded-lg p-4 border border-[#2A3238] hover:border-[#3A434A] transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{price.symbol}/USD</p>
                    <Badge variant={price.symbol.toLowerCase() as 'eth' | 'btc'} size="sm">
                      {price.symbol}
                    </Badge>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                  <span className="text-xs">
                    {isPositive ? '▲' : '▼'}
                  </span>
                  <span className="text-sm font-semibold">
                    {isPositive ? '+' : ''}{price.change24hPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-white mb-1">
                  ${price.price.toLocaleString()}
                </p>
                <p className="text-xs text-[#8B9299]">
                  24h Change: 
                  <span className={`ml-1 ${isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                    {isPositive ? '+' : ''}${price.change24h.toLocaleString()}
                  </span>
                </p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-[#2A3238]">
                <div className="flex justify-between text-xs">
                  <span className="text-[#8B9299]">HP Recovery Rate</span>
                  <span style={{ color }}>
                    {isPositive ? '+' : ''}{(price.change24hPercent * (isPositive ? 10 : 5)).toFixed(0)} HP/5min
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-[#121619] rounded-lg">
        <p className="text-xs text-[#8B9299]">
          📊 Prices from Chainlink Data Feeds • Updates every 5 minutes
        </p>
      </div>
    </Card>
  );
};
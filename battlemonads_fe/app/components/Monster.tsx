'use client';

import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { useBattleMonads } from '../hooks/useBattleMonads';

interface MonsterProps {
  monsterId: number;
  battleId?: number;
  isInBattle?: boolean;
}

export const Monster: React.FC<MonsterProps> = ({
  monsterId,
  isInBattle = false,
}) => {
  const { useMonster, MonsterType } = useBattleMonads();
  const { data: monster, isLoading } = useMonster(monsterId);

  if (isLoading || !monster) {
    return (
      <Card className="animate-pulse">
        <div className="h-48 bg-[#121619] rounded-lg"></div>
      </Card>
    );
  }

  const [id, monsterType, birthPrice, currentHP, maxHP, createTime, exists] = monster;
  
  if (!exists) {
    return null;
  }

  const type = monsterType === MonsterType.ETH ? 'ETH' : 'BTC';
  const birthPriceUsd = Number(birthPrice) / 1e8; // Chainlink price feeds have 8 decimals
  
  // 현재 가격은 실시간 price feed에서 가져와야 함 (임시로 birth price 사용)
  const currentPrice = birthPriceUsd;
  const priceChange = 0; // 실제 구현에서는 현재 가격과 birth price 비교
  const isPositive = priceChange >= 0;
  
  const monsterEmoji = type === 'ETH' ? '🦄' : '🦁';
  const variant = type === 'ETH' ? 'eth' : 'btc';
  
  return (
    <Card variant={variant} glow={isInBattle} className="relative">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{monsterEmoji}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{type} Monster</h3>
              <Badge variant={variant} size="sm">{type}</Badge>
            </div>
            <p className="text-xs text-[#8B9299] mt-1">#{String(id).padStart(3, '0')}</p>
          </div>
        </div>
        {isInBattle && (
          <Badge variant="warning">In Battle</Badge>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <ProgressBar
            value={Number(currentHP)}
            max={Number(maxHP)}
            variant={variant}
            showLabel
            label="HP"
            height="lg"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#121619] rounded-lg p-3">
            <p className="text-xs text-[#8B9299] mb-1">Birth Price</p>
            <p className="text-lg font-semibold text-white">
              ${birthPriceUsd.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-[#121619] rounded-lg p-3">
            <p className="text-xs text-[#8B9299] mb-1">Current Price</p>
            <p className="text-lg font-semibold text-white">
              ${currentPrice.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="bg-[#121619] rounded-lg p-3">
          <p className="text-xs text-[#8B9299] mb-1">Price Change</p>
          <p className={`text-xl font-bold ${isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
          <p className="text-xs text-[#8B9299] mt-1">
            HP Recovery: {isPositive ? '+' : ''}{Math.floor(priceChange * (isPositive ? 10 : 5))} HP/5min
          </p>
        </div>
        
        <div className="pt-3 border-t border-[#2A3238]">
          <p className="text-xs text-[#8B9299]">Created</p>
          <p className="text-sm text-white">
            {new Date(Number(createTime) * 1000).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};
'use client';

import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useBattleMonads } from '../hooks/useBattleMonads';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { formatEther } from 'viem';
import { monadTestnet } from '../config/wagmi';

interface BettingPanelProps {
  battleId: number;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({ battleId }) => {
  const { address, chainId } = useAccount();
  const { data: balance } = useBalance({ address });
  const { switchChain } = useSwitchChain();
  const { 
    bet, 
    useUserBets, 
    isPending, 
    MonsterType,
    formatMonAmount 
  } = useBattleMonads();

  const { data: userBets } = useUserBets(battleId, address || '');

  const [selectedMonster, setSelectedMonster] = useState<typeof MonsterType[keyof typeof MonsterType] | null>(null);
  const [betAmount, setBetAmount] = useState('');
  
  const handleBet = async () => {
    if (selectedMonster !== null && betAmount && address) {
      try {
        // Check if we're on the correct network
        if (chainId !== monadTestnet.id) {
          await switchChain({ chainId: monadTestnet.id });
          return; // Exit and let user retry after network switch
        }
        
        // 베팅 금액 검증 (0.01 ~ 1 MON)
        const amount = parseFloat(betAmount);
        if (amount < 0.01 || amount > 1) {
          alert('Bet amount must be between 0.01 and 1 MON');
          return;
        }
        
        await bet(battleId, selectedMonster, betAmount);
        setBetAmount('');
        setSelectedMonster(null);
      } catch (error) {
        console.error('Bet failed:', error);
        alert('Bet failed. Please try again.');
      }
    }
  };
  
  
  const ethBet = userBets ? formatMonAmount(userBets[0]) : '0';
  const btcBet = userBets ? formatMonAmount(userBets[1]) : '0';
  const totalBets = parseFloat(ethBet) + parseFloat(btcBet);
  
  return (
    <Card className="w-full">
      <h3 className="text-xl font-bold text-white mb-4">Battle Controls</h3>
      
      <div className="space-y-4">
        <div className="bg-[#121619] rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-[#8B9299]">Your Balance</span>
            <span className="text-lg font-bold text-[#5AD8CC]">
              {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0'} MON
            </span>
          </div>
          
          {totalBets > 0 && (
            <div className="pt-3 border-t border-[#2A3238] space-y-2">
              <p className="text-xs text-[#8B9299]">Your Active Bets</p>
              {parseFloat(ethBet) > 0 && (
                <div className="flex justify-between">
                  <Badge variant="eth">ETH Monster</Badge>
                  <span className="text-sm text-white">{parseFloat(ethBet).toFixed(4)} MON</span>
                </div>
              )}
              {parseFloat(btcBet) > 0 && (
                <div className="flex justify-between">
                  <Badge variant="btc">BTC Monster</Badge>
                  <span className="text-sm text-white">{parseFloat(btcBet).toFixed(4)} MON</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm text-[#8B9299] mb-2">Place Your Bet To Your Side</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setSelectedMonster(MonsterType.ETH)}
              className={`
                p-3 rounded-lg border transition-all
                ${selectedMonster === MonsterType.ETH 
                  ? 'bg-[#627EEA]/20 border-[#627EEA] text-[#627EEA]' 
                  : 'bg-[#121619] border-[#2A3238] text-[#8B9299] hover:border-[#627EEA]/50'
                }
              `}
            >
              🦄 ETH Monster
            </button>
            <button
              onClick={() => setSelectedMonster(MonsterType.BTC)}
              className={`
                p-3 rounded-lg border transition-all
                ${selectedMonster === MonsterType.BTC 
                  ? 'bg-[#F7931A]/20 border-[#F7931A] text-[#F7931A]' 
                  : 'bg-[#121619] border-[#2A3238] text-[#8B9299] hover:border-[#F7931A]/50'
                }
              `}
            >
              🦁 BTC Monster
            </button>
          </div>
          
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.01 - 1.0 MON"
              min="0.01"
              max="1.0"
              step="0.01"
              className="flex-1 bg-[#121619] border border-[#2A3238] rounded-lg px-3 py-2 text-white placeholder-[#5A6269] focus:outline-none focus:border-[#5AD8CC]"
            />
            <Button
              onClick={handleBet}
              disabled={selectedMonster === null || !betAmount || parseFloat(betAmount) < 0.01 || parseFloat(betAmount) > 1 || isPending || !address}
            >
              {isPending ? 'Betting...' : 'Place Bet'}
            </Button>
          </div>
          <p className="text-xs text-[#8B9299] mb-4">Minimum: 0.01 MON • Maximum: 1 MON</p>
        </div>
        
      </div>
    </Card>
  );
};
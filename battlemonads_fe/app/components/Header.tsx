'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { formatEther } from 'viem';
import { useSupabase } from '../providers/SupabaseProvider';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { monadTestnet } from '../config/wagmi';

export const Header: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { supabase, user, linkWalletAddress } = useSupabase();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Discord 로그인하고 지갑이 연결되어 있으면 자동으로 매핑
  useEffect(() => {
    if (user && address && isConnected) {
      linkWalletAddress(address);
    }
  }, [user, address, isConnected, linkWalletAddress]);

  const isCorrectNetwork = chainId === monadTestnet.id;
  const networkName = isCorrectNetwork ? 'Monad Testnet' : `Chain ID: ${chainId}`;

  const handleConnect = () => {
    connect({ connector: metaMask() });
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: monadTestnet.id });
  };

  const formatBalance = (balance: bigint): string => {
    return Number(formatEther(balance)).toFixed(4);
  };

  // 서버 사이드 렌더링 중에는 기본 UI를 보여줌
  if (!mounted) {
    return (
      <header className="w-full bg-[#1a1f24] border-b border-[#2A3238]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <h1 className="text-xl font-bold text-[#5AD8CC]">
                Battle Monads
              </h1>
              <span className="text-xs text-[#8B9299] hidden sm:block">
                Price-based Monster Battles on Monad
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                <span className="text-xs text-[#8B9299]">Live</span>
              </div>
              
              <Button 
                size="sm"
                disabled
                className="flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-500 fill-current">
                  <path d="M22.5 12c0-5.8-4.7-10.5-10.5-10.5S1.5 6.2 1.5 12 6.2 22.5 12 22.5 22.5 17.8 22.5 12zM12 20.5c-4.7 0-8.5-3.8-8.5-8.5S7.3 3.5 12 3.5s8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z"/>
                </svg>
                Connect MetaMask
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="w-full bg-[#1a1f24] border-b border-[#2A3238]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <h1 className="text-xl font-bold text-[#5AD8CC]">
              Battle Monads
            </h1>
            <span className="text-xs text-[#8B9299] hidden sm:block">
              Price-based Monster Battles on Monad
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                isCorrectNetwork ? 'bg-[#4ADE80]' : 'bg-[#F87171]'
              }`} />
              <span className="text-xs text-[#8B9299]">{networkName}</span>
              {!isCorrectNetwork && isConnected && (
                <Badge variant="warning" size="sm">Wrong Network</Badge>
              )}
            </div>

            {/* Discord Login Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="bg-[#121619] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    {user.user_metadata?.avatar_url ? (
                      <Image 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#5AD8CC] flex items-center justify-center">
                        <span className="text-xs font-bold text-black">
                          {user.email?.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{user.user_metadata?.full_name || user.email}</p>
                      <p className="text-xs text-[#8B9299]">Discord</p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => supabase.auth.signOut()} 
                  size="sm" 
                  variant="ghost"
                  className="text-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => supabase.auth.signInWithOAuth({ 
                  provider: 'discord',
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                  }
                })}
                size="sm"
                variant="secondary"
                className="flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#5865F2]">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.030zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Discord Login
              </Button>
            )}
            
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <div className="bg-[#121619] rounded-lg px-3 py-2">
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-500 fill-current">
                          <path d="M22.5 12c0-5.8-4.7-10.5-10.5-10.5S1.5 6.2 1.5 12 6.2 22.5 12 22.5 22.5 17.8 22.5 12zM12 20.5c-4.7 0-8.5-3.8-8.5-8.5S7.3 3.5 12 3.5s8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z"/>
                          <path d="M15.3 10.1c-.2-.7-.7-1.2-1.4-1.4-.2-.1-.5-.1-.7-.1h-2.6c-.2 0-.4.2-.4.4v6c0 .2.2.4.4.4s.4-.2.4-.4v-2.2h2.2c.3 0 .5 0 .7-.1.7-.2 1.2-.7 1.4-1.4.1-.4.1-.8 0-1.2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-[#8B9299]">MetaMask</p>
                        <p className="text-sm font-mono text-[#5AD8CC]">
                          {address.slice(0, 6)}...{address.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8B9299]">Balance</p>
                      <p className="text-sm font-semibold text-white">
                        {balance ? formatBalance(balance.value) : '0.0000'} MON
                      </p>
                    </div>
                  </div>
                </div>
                
                {!isCorrectNetwork && (
                  <Button 
                    onClick={handleSwitchNetwork}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                  >
                    Switch Network
                  </Button>
                )}
                
                <Button 
                  onClick={() => disconnect()} 
                  size="sm" 
                  variant="ghost"
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConnect}
                size="sm"
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  'Connecting...'
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-orange-500 fill-current">
                      <path d="M22.5 12c0-5.8-4.7-10.5-10.5-10.5S1.5 6.2 1.5 12 6.2 22.5 12 22.5 22.5 17.8 22.5 12zM12 20.5c-4.7 0-8.5-3.8-8.5-8.5S7.3 3.5 12 3.5s8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z"/>
                    </svg>
                    Connect MetaMask
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
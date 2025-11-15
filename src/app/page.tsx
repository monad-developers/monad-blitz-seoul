'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { generateTraits } from '@/lib/traitGenerator';
import { TraitPreview } from '@/components/TraitPreview';
import { MintButton } from '@/components/MintButton';
import { WealthTier } from '@/types';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [traits, setTraits] = useState<any>(null);
  const [wealthData, setWealthData] = useState<any>(null);

  useEffect(() => {
    if (address) {
      // Generate traits
      const generatedTraits = generateTraits(address);
      setTraits(generatedTraits);

      // Mock wealth data (실제로는 컨트랙트에서 조회)
      setWealthData({
        wealthTier: WealthTier.BRONZE,
        specialItem: 1,
        totalWealthUSD: 1500,
        ethValueUSD: 1000,
        usdtValueUSD: 300,
        usdcValueUSD: 200,
      });
    }
  }, [address]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Minecraft PFP NFT
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Deterministic traits + Wealth-based special items
          </p>
        </header>

        {/* Connect Wallet */}
        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {/* Main Content */}
        {isConnected && address && traits && wealthData ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: 3D Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">미리보기</h2>
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">3D 렌더링 영역</p>
                {/* 실제 구현 시 Three.js 캔버스가 들어갈 위치 */}
              </div>
              <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                주소: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>

            {/* Right: Traits & Mint */}
            <div className="space-y-6">
              <TraitPreview
                traits={traits}
                wealthTier={wealthData.wealthTier}
                specialItem={wealthData.specialItem}
                totalWealthUSD={wealthData.totalWealthUSD}
                ethValueUSD={wealthData.ethValueUSD}
                usdtValueUSD={wealthData.usdtValueUSD}
                usdcValueUSD={wealthData.usdcValueUSD}
              />

              <MintButton
                wealthTier={wealthData.wealthTier}
                specialItem={wealthData.specialItem}
                totalWealthUSD={wealthData.totalWealthUSD}
                ethValueUSD={wealthData.ethValueUSD}
                usdtValueUSD={wealthData.usdtValueUSD}
                usdcValueUSD={wealthData.usdcValueUSD}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              지갑을 연결하여 시작하세요
            </p>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <FeatureCard
            icon="🎨"
            title="Deterministic Traits"
            description="주소 기반으로 항상 동일한 속성 생성"
          />
          <FeatureCard
            icon="💎"
            title="Wealth-based Items"
            description="자산 등급에 따른 특별 아이템 부여"
          />
          <FeatureCard
            icon="🎬"
            title="Animated GIF"
            description="60 프레임 3D 애니메이션 GIF"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

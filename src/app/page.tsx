'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { generateTraits } from '@/lib/traitGenerator';
import { TraitPreview } from '@/components/TraitPreview';
import { MintButton } from '@/components/MintButton';
import { SkinRenderer3D } from '@/components/SkinRenderer3D';
import { WealthTier } from '@/types';
import { MinecraftPFPABI } from '@/lib/contractABI';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [traits, setTraits] = useState<any>(null);
  const [wealthData, setWealthData] = useState<any>(null);

  // 컨트랙트 주소 가져오기
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

  // 컨트랙트에서 previewMint 호출
  const { data: previewData, isError, isLoading } = useReadContract({
    address: contractAddress,
    abi: MinecraftPFPABI,
    functionName: 'previewMint',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  useEffect(() => {
    if (address) {
      // Generate traits (로컬에서도 생성하여 빠른 UI 표시)
      const generatedTraits = generateTraits(address);
      setTraits(generatedTraits);

      // 컨트랙트 데이터가 있으면 사용, 없으면 로컬 계산값 사용
      if (previewData) {
        const [contractTraits, totalWealthUSD, wealthTier, specialItem, ethValueUSD, usdtValueUSD, usdcValueUSD] = previewData;

        setWealthData({
          wealthTier: Number(wealthTier),
          specialItem: Number(specialItem),
          totalWealthUSD: Number(totalWealthUSD) / 1e8, // 8 decimals to USD
          ethValueUSD: Number(ethValueUSD) / 1e8,
          usdtValueUSD: Number(usdtValueUSD) / 1e8,
          usdcValueUSD: Number(usdcValueUSD) / 1e8,
        });
      } else if (!contractAddress) {
        // 컨트랙트가 배포되지 않았을 때 기본값 사용 (개발 모드)
        setWealthData({
          wealthTier: WealthTier.NONE,
          specialItem: 0,
          totalWealthUSD: 0,
          ethValueUSD: 0,
          usdtValueUSD: 0,
          usdcValueUSD: 0,
        });
      }
    }
  }, [address, previewData, contractAddress]);

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
        {isConnected && address ? (
          <>
            {/* 로딩 상태 */}
            {isLoading && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">데이터 로딩 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {isError && !contractAddress && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <p className="text-yellow-800 dark:text-yellow-200">
                  ⚠️ 컨트랙트가 아직 배포되지 않았습니다. 개발 모드로 실행 중입니다.
                </p>
              </div>
            )}

            {/* 데이터 준비 완료 */}
            {traits && wealthData && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: 3D Preview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">미리보기</h2>
                  <div className="flex items-center justify-center">
                    <SkinRenderer3D traits={traits} width={512} height={512} />
                  </div>
                  <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                    주소: {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-500">
                    ↻ 자동 회전 애니메이션
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
            )}
          </>
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

'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { generateTraits } from '@/lib/traitGenerator';
import { TraitPreview } from '@/components/TraitPreview';
import { MintButton } from '@/components/MintButton';
import dynamic from 'next/dynamic';

const MinecraftSkinViewer = dynamic(
  () => import('@/components/MinecraftSkinViewer').then((mod) => mod.MinecraftSkinViewer),
  { ssr: false }
);
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
    // 지갑 연결 여부와 관계없이 미리보기 표시
    const displayAddress = address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // 기본 예시 주소

    // Traits를 서버에서 가져오기
    const fetchTraits = async () => {
      try {
        const response = await fetch(`/api/traits/${displayAddress}`);
        if (!response.ok) {
          throw new Error('Failed to fetch traits');
        }
        const data = await response.json();
        setTraits(data.traits);
      } catch (error) {
        console.error('[Page] Failed to fetch traits:', error);
        // Fallback: 클라이언트에서 생성
        const generatedTraits = generateTraits(displayAddress);
        setTraits(generatedTraits);
      }
    };

    fetchTraits();

    // 컨트랙트 데이터가 있으면 사용, 없으면 로컬 계산값 사용
    if (previewData && address) {
      const [contractTraits, totalWealthUSD, wealthTier, specialItem, ethValueUSD, usdtValueUSD, usdcValueUSD] = previewData;

      setWealthData({
        wealthTier: Number(wealthTier),
        specialItem: Number(specialItem),
        totalWealthUSD: Number(totalWealthUSD) / 1e8, // 8 decimals to USD
        ethValueUSD: Number(ethValueUSD) / 1e8,
        usdtValueUSD: Number(usdtValueUSD) / 1e8,
        usdcValueUSD: Number(usdcValueUSD) / 1e8,
      });
    } else {
      // 기본값 사용 (개발 모드 또는 지갑 미연결 시)
      setWealthData({
        wealthTier: WealthTier.NONE,
        specialItem: 0,
        totalWealthUSD: 0,
        ethValueUSD: 0,
        usdtValueUSD: 0,
        usdcValueUSD: 0,
      });
    }
  }, [address, previewData, contractAddress]);

  return (
    <main className="min-h-screen minecraft-bg p-8 relative overflow-hidden">
      {/* 마인크래프트 배경 패턴 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 4px)',
        backgroundSize: '4px 4px'
      }} />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="minecraft-font text-6xl text-white minecraft-text-shadow">
            NADcraft PFP NFT
          </h1>
          <p className="minecraft-font text-lg text-[#AAAAAA] minecraft-text-shadow">
            Deterministic traits + Wealth-based special items
          </p>
        </header>

        {/* Connect Wallet */}
        <div className="flex justify-center">
          <ConnectButton />
        </div>

        {/* Main Content */}
        {traits && wealthData && (
          <>
            {/* 지갑 미연결 시 안내 */}
            {!isConnected && (
              <div className="bg-[#5B8FC6] border-4 border-t-[#7FAFD6] border-l-[#7FAFD6] border-r-[#2B4F66] border-b-[#2B4F66] p-6 text-center mb-8">
                <p className="minecraft-font text-white text-sm minecraft-text-shadow">
                  💡 미리보기 모드입니다. 지갑을 연결하면 자신의 주소로 생성된 NFT를 확인할 수 있습니다.
                </p>
              </div>
            )}

            {/* 로딩 상태 */}
            {isConnected && isLoading && (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#55FF55]"></div>
                <p className="mt-4 minecraft-font text-white minecraft-text-shadow">데이터 로딩 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {isConnected && isError && !contractAddress && (
              <div className="bg-[#FFD700] border-4 border-t-[#FFED4E] border-l-[#FFED4E] border-r-[#AA8700] border-b-[#AA8700] p-6 text-center">
                <p className="minecraft-font text-[#3C3C3C] text-sm">
                  ⚠️ 컨트랙트가 아직 배포되지 않았습니다. 개발 모드로 실행 중입니다.
                </p>
              </div>
            )}

            {/* 데이터 준비 완료 */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: 3D Preview */}
              <div className="bg-[#C6C6C6] border-4 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#555555] border-b-[#555555] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] p-6">
                <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-3 mb-4">
                  <h2 className="minecraft-font text-white text-xl minecraft-text-shadow">미리보기</h2>
                </div>

                <div className="flex items-center justify-center bg-[#8B8B8B] border-2 border-t-[#373737] border-l-[#373737] border-r-[#DFDFDF] border-b-[#DFDFDF] p-4">
                  <MinecraftSkinViewer
                    address={address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'}
                    width={512}
                    height={512}
                  />
                </div>
                <p className="mt-4 minecraft-font text-sm text-center text-[#3C3C3C]">
                  주소: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0xf39F...2266'}
                </p>
                <p className="mt-2 minecraft-font text-xs text-center text-[#555555]">
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

                {isConnected ? (
                  <MintButton
                    wealthTier={wealthData.wealthTier}
                    specialItem={wealthData.specialItem}
                    totalWealthUSD={wealthData.totalWealthUSD}
                    ethValueUSD={wealthData.ethValueUSD}
                    usdtValueUSD={wealthData.usdtValueUSD}
                    usdcValueUSD={wealthData.usdcValueUSD}
                  />
                ) : (
                  <div className="bg-[#8B7355] border-4 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#555555] border-b-[#555555] p-6 text-center">
                    <p className="minecraft-font text-white mb-4 minecraft-text-shadow">
                      NFT를 민팅하려면 지갑을 연결하세요
                    </p>
                    <ConnectButton />
                  </div>
                )}
              </div>
            </div>
          </>
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
    <div className="bg-[#654321] border-4 border-t-[#8B6331] border-l-[#8B6331] border-r-[#3C2311] border-b-[#3C2311] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)] p-6 text-center hover:translate-y-[-2px] transition-transform">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="minecraft-font text-lg text-white mb-2 minecraft-text-shadow">{title}</h3>
      <p className="minecraft-font text-xs text-[#CCCCCC]">{description}</p>
    </div>
  );
}

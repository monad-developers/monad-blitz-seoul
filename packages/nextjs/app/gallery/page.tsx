'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useMintedProfiles } from "~~/hooks/useMintedProfiles";

const cards = [
  {
    id: 1,
    name: '김개발',
    role: 'Senior Solidity Developer',
    category: 'developer',
    skills: ['Solidity', 'Web3', 'DeFi'],
    bio: '5년간 블록체인 개발 경험을 바탕으로 DeFi 프로토콜과 NFT 마켓플레이스를 구축해왔습니다.',
    contact: '@kimdev_eth',
    portfolio: 'portfolio.kimdev.eth',
    gradient: 'from-purple-600 to-blue-600',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 2,
    name: '박디자인',
    role: 'UI/UX Designer',
    category: 'designer',
    skills: ['Figma', 'Web Design', 'Mobile'],
    bio: '사용자 중심의 디자인으로 Web3 서비스의 접근성을 높이는 작업을 하고 있습니다.',
    contact: '@parkdesign',
    portfolio: 'parkdesign.xyz',
    gradient: 'from-pink-500 to-orange-500',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 3,
    name: '이창업',
    role: 'CEO & Founder',
    category: 'founder',
    skills: ['Strategy', 'Leadership', 'Web3'],
    bio: '두 번의 성공적인 엑시트 경험을 바탕으로 Web3 스타트업을 운영하고 있습니다.',
    contact: '@lee_founder',
    portfolio: 'company.lee.eth',
    gradient: 'from-green-500 to-teal-500',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 4,
    name: '정투자',
    role: 'Blockchain Investor',
    category: 'investor',
    skills: ['Investment', 'Strategy', 'DeFi'],
    bio: 'Web3 생태계의 혁신적인 프로젝트들에 투자하며 블록체인 기술의 미래를 만들어갑니다.',
    contact: '@jung_investor',
    portfolio: 'jung.capital',
    gradient: 'from-indigo-500 to-purple-500',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 5,
    name: '최프론트',
    role: 'Frontend Developer',
    category: 'developer',
    skills: ['React', 'TypeScript', 'Web3'],
    bio: '아름다운 사용자 인터페이스와 Web3 기술을 결합하여 차세대 웹 애플리케이션을 개발합니다.',
    contact: '@choi_frontend',
    portfolio: 'choi.dev',
    gradient: 'from-cyan-500 to-blue-500',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 6,
    name: '윤마케팅',
    role: 'Growth Marketing',
    category: 'founder',
    skills: ['Marketing', 'Growth', 'Community'],
    bio: 'Web3 프로젝트의 성장을 위한 마케팅 전략을 수립하고 커뮤니티를 구축하는 전문가입니다.',
    contact: '@yoon_growth',
    portfolio: 'yoon.marketing',
    gradient: 'from-emerald-500 to-green-500',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  }
];

const GalleryPage: NextPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFlipped, setIsFlipped] = useState<{[key: string | number]: boolean}>({});
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  // 실제 민팅된 NFT 프로필 데이터 로드
  const { mintedProfiles, isLoading: mintedLoading, error: mintedError, totalSupply } = useMintedProfiles();

  // 민팅된 프로필과 예시 데이터 결합
  useEffect(() => {
    const combineProfiles = () => {
      const combined: any[] = [];
      
      // 1. 실제 민팅된 프로필들 추가
      mintedProfiles.forEach((mintedProfile, index) => {
        if (mintedProfile.profile) {
          combined.push({
            id: `minted-${mintedProfile.tokenId}`,
            tokenId: mintedProfile.tokenId,
            name: mintedProfile.profile.name,
            role: mintedProfile.profile.role,
            bio: mintedProfile.profile.introduction,
            aiSummary: mintedProfile.profile.aiSummary, // AI 요약 추가
            skills: mintedProfile.profile.skills ? mintedProfile.profile.skills.split(',').map(s => s.trim()) : [],
            contact: mintedProfile.profile.contact,
            portfolio: mintedProfile.profile.portfolioLink,
            category: 'minted', // 특별 카테고리
            gradient: 'from-green-500 to-emerald-500', // 민팅된 카드는 초록색
            avatar: mintedProfile.profile.profileImageUrl, // 실제 프로필 이미지 사용
            isMinted: true,
            mintedAt: new Date(mintedProfile.mintedAt * 1000).toISOString(),
            owner: mintedProfile.owner
          });
        }
      });
      
      // 2. 예시 데이터 추가 (민팅되지 않은 카드들)
      const remainingExamples = cards.map(card => ({
        ...card,
        isMinted: false,
        tokenId: null,
        aiSummary: null // 예시 카드에는 AI 요약 없음
      }));
      
      combined.push(...remainingExamples);
      
      setAllProfiles(combined);
      console.log(`🎨 갤러리 프로필 업데이트: ${mintedProfiles.length}개 민팅됨, ${combined.length}개 총 표시`);
    };

    combineProfiles();
  }, [mintedProfiles]);

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'minted', name: '💎 NFT 발행됨' },
    { id: 'developer', name: '개발자' },
    { id: 'designer', name: '디자이너' },
    { id: 'founder', name: '창업가' },
    { id: 'investor', name: '투자자' }
  ];

  const filteredCards = selectedCategory === 'all' 
    ? allProfiles 
    : allProfiles.filter(card => card.category === selectedCategory);

  const handleCardFlip = (cardId: string | number) => {
    setIsFlipped(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20">

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium backdrop-blur-sm">
              명판 갤러리
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Discover Talents
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-4">
            Web3 생태계의 다양한 인재들을 만나보세요
          </p>
          
          {/* 민팅 상태 표시 */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {totalSupply !== undefined && (
              <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/30">
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                <span className="text-green-100 text-sm font-medium">
                  {Number(totalSupply)}개 NFT 발행됨
                </span>
              </div>
            )}
            
            {mintedLoading && (
              <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30">
                <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
                <span className="text-blue-100 text-sm font-medium">
                  NFT 데이터 로드 중...
                </span>
              </div>
            )}
            
            {mintedError && (
              <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-400/30">
                <i className="ri-error-warning-line text-red-300"></i>
                <span className="text-red-100 text-sm font-medium">
                  데이터 로드 오류
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 border border-white/10 rounded-full p-2 backdrop-blur-sm">
            <div className="flex space-x-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCards.map((card) => (
            <div 
              key={card.id}
              className="relative aspect-[5/8] cursor-pointer group"
              onClick={() => handleCardFlip(card.id)}
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`relative w-full h-full transition-transform duration-700 ease-in-out ${
                  isFlipped[card.id] ? 'rotate-y-180' : ''
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                
                {/* Front Side */}
                <div 
                  className="absolute inset-0 backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border shadow-2xl shadow-black/50 group-hover:shadow-white/10 transition-shadow duration-300 ${
                    card.isMinted 
                      ? 'border-green-400/50 shadow-green-400/20 hover:shadow-green-400/30' 
                      : 'border-white/20'
                  }`}>
                    
                    {/* NFT 배지 */}
                    {card.isMinted && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full border border-green-400">
                          <i className="ri-trophy-line text-xs text-white"></i>
                          <span className="text-xs font-bold text-white">NFT</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Profile Image - Top Half */}
                    <div className="absolute inset-x-0 top-0 h-3/5 rounded-t-3xl overflow-hidden">
                      {card.avatar ? (
                        <>
                          <img 
                            src={card.avatar} 
                            alt={card.name}
                            className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
                            onLoad={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.opacity = '0.9';
                              const fallbackElement = target.nextElementSibling as HTMLElement;
                              if (fallbackElement) fallbackElement.style.display = 'none';
                            }}
                            onError={(e) => {
                              console.warn(`❌ 이미지 로드 실패: ${card.avatar} (${card.name})`);
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const fallbackElement = target.nextElementSibling as HTMLElement;
                              if (fallbackElement) fallbackElement.style.display = 'flex';
                            }}
                          />
                          {/* 이미지 로딩 중 또는 실패 시 표시할 fallback */}
                          <div className={`w-full h-full bg-gradient-to-br ${card.gradient.replace('from-', 'from-').replace('to-', '/80 to-')}/80 flex items-center justify-center`}>
                            <i className="ri-user-line text-6xl text-white/60"></i>
                          </div>
                        </>
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${card.gradient.replace('from-', 'from-').replace('to-', '/80 to-')}/80 flex items-center justify-center`}>
                          <i className="ri-user-line text-6xl text-white/60"></i>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10"></div>
                      
                      {/* 민팅된 카드임을 나타내는 추가 표시 */}
                      {card.isMinted && (
                        <div className="absolute bottom-2 left-2">
                          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                            <i className="ri-image-line text-xs text-green-300"></i>
                            <span className="text-xs text-green-300 font-medium">실제 프로필</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Area - Bottom Half */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-white/10 backdrop-blur-lg rounded-b-3xl p-6 text-white border-t border-white/20">
                      <div className="text-center mb-3">
                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{card.name}</h3>
                        <p className="text-sm font-medium text-white/90 drop-shadow-md">
                          {card.role}
                        </p>
                      </div>

                      <div className="flex justify-center mb-3">
                        <div className="inline-flex items-center gap-2 bg-green-400/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-300/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                          <span className="text-xs font-medium text-green-100">Available</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        {card.skills.slice(0, 2).map((skill: string, index: number) => (
                          <span key={index} className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white border border-white/30">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs text-white/90">
                        <i className="ri-at-line drop-shadow-md"></i>
                        <span className="truncate drop-shadow-md">{card.contact}</span>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-50 pointer-events-none"></div>
                  </div>
                </div>

                {/* Back Side */}
                <div 
                  className="absolute inset-0 backface-hidden rotate-y-180"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border shadow-2xl shadow-black/50 group-hover:shadow-white/10 transition-shadow duration-300 ${
                    card.isMinted 
                      ? 'border-green-400/50 shadow-green-400/20 hover:shadow-green-400/30' 
                      : 'border-white/20'
                  }`}>
                    <div className="h-full p-5 flex flex-col text-white">
                      
                      <div className="text-center mb-3">
                        <h4 className="font-bold text-white text-sm mb-1 drop-shadow-lg tracking-tight">소개</h4>
                        <div className="w-8 h-px bg-white/30 mx-auto"></div>
                      </div>
                      
                      <div className="flex-1 mb-3">
                        {/* 기본 소개글 */}
                        {card.bio && (
                          <p className="text-white/90 text-xs leading-tight tracking-tight mb-3">
                            {card.bio}
                          </p>
                        )}
                        
                        {/* AI 요약 (민팅된 카드의 경우) */}
                        {card.isMinted && card.aiSummary && (
                          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg p-2 border border-green-400/30 shadow-lg shadow-green-400/20">
                            <div className="flex items-center gap-1 mb-1">
                              <i className="ri-sparkle-line text-xs text-green-300 animate-pulse"></i>
                              <span className="text-xs font-bold text-green-300">Gemini AI 요약</span>
                            </div>
                            <p className="text-white/90 text-xs leading-tight tracking-tight line-clamp-4 font-medium">
                              {card.aiSummary}
                            </p>
                          </div>
                        )}
                        
                        {/* AI 요약이 없고 기본 소개글도 없는 경우 */}
                        {!card.bio && !card.aiSummary && (
                          <p className="text-white/60 text-xs leading-tight tracking-tight italic">
                            소개 정보가 없습니다.
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {card.skills.slice(0, 6).map((skill: string, index: number) => (
                            <span key={index} className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/20">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-white/90">
                          <i className="ri-at-line text-xs"></i>
                          <span className="truncate font-medium tracking-tight">{card.contact}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-white/90">
                          <i className="ri-external-link-line text-xs"></i>
                          <span className="font-medium tracking-tight">{card.portfolio}</span>
                        </div>
                        
                        {/* NFT 전용 정보 */}
                        {card.isMinted && (
                          <div className="mt-3 pt-2 border-t border-white/10">
                            <div className="text-center space-y-1">
                              <div className="flex items-center justify-center gap-1.5 text-xs text-green-300">
                                <i className="ri-nft-line text-xs"></i>
                                <span className="font-medium">Token ID: {card.tokenId}</span>
                              </div>
                              {card.owner && (
                                <div className="flex items-center justify-center gap-1.5 text-xs text-white/70">
                                  <i className="ri-user-line text-xs"></i>
                                  <span className="font-mono text-xs truncate">
                                    {card.owner.slice(0, 6)}...{card.owner.slice(-4)}
                                  </span>
                                </div>
                              )}
                              {card.mintedAt && (
                                <div className="flex items-center justify-center gap-1.5 text-xs text-white/60">
                                  <i className="ri-time-line text-xs"></i>
                                  <span className="text-xs">
                                    {new Date(card.mintedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-50 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 rounded-full mx-auto mb-6 flex items-center justify-center">
              <i className="ri-search-line text-4xl text-white/40"></i>
            </div>
            <h3 className="text-2xl font-bold text-white/80 mb-4">명판이 없습니다</h3>
            <p className="text-white/60 mb-8">선택한 카테고리에 해당하는 명판이 없습니다.</p>
            <Link href="/create" className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-white/90 transition-all">
              첫 명판 만들기
            </Link>
          </div>
        )}

        {/* Floating Instructions */}
        <div className="fixed bottom-8 right-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 max-w-xs shadow-xl">
          <div className="flex items-center gap-3 text-white/80">
            <i className="ri-hand-coin-line text-lg"></i>
            <span className="text-sm">명판을 클릭하여 뒷면을 확인하세요</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;

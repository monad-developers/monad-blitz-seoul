"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount, useChainId, useChains, useDisconnect } from "wagmi";
import { Address, WalletConnectLogin } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const { disconnect } = useDisconnect();
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mousePx, setMousePx] = useState({ x: 0, y: 0 });
  const [orb1Position, setOrb1Position] = useState({ x: 10, y: 20 });
  const [orb2Position, setOrb2Position] = useState({ x: 10, y: 20 });

  const currentChain = chains.find(chain => chain.id === chainId);

  // 스마트 컨트랙트 데이터 조회 (ERC1155 버전 사용)
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "ProfileNFT1155",
    functionName: "totalMintedTokens",
  });

  const { data: hasProfile, isLoading: profileLoading, error: profileError } = useScaffoldReadContract({
    contractName: "ProfileNFT1155", 
    functionName: "profileExists",
    args: [connectedAddress],
  });

  // 디버깅 정보
  useEffect(() => {
    console.log('Home page contract data:', {
      connectedAddress,
      totalSupply: totalSupply?.toString(),
      hasProfile,
      profileLoading,
      profileError
    });
  }, [connectedAddress, totalSupply, hasProfile, profileLoading, profileError]);

  const features = [
    {
      icon: 'ri-palette-line',
      title: '개인 브랜딩',
      description: 'AI가 당신의 이력을 분석하여 완벽한 개인 브랜드를 만들어드립니다.'
    },
    {
      icon: 'ri-magic-line',
      title: '스마트 디자인',
      description: '프로페셔널한 명판 디자인이 자동으로 생성됩니다.'
    },
    {
      icon: 'ri-rocket-line',
      title: '자동 배포',
      description: 'Web3 네트워크 전반에 당신의 명판을 자동으로 배포합니다.'
    }
  ];

  // 마우스 위치 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 자동 애니메이션 효과
  useEffect(() => {
    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      // 첫 번째 orb - 원형 움직임
      setOrb1Position({
        x: 10 + Math.sin(elapsed * 0.5) * 15 + (mousePosition.x - 50) * 0.02,
        y: 20 + Math.cos(elapsed * 0.3) * 10 + (mousePosition.y - 50) * 0.015
      });

      // 두 번째 orb - 다른 패턴의 움직임
      setOrb2Position({
        x: 10 + Math.cos(elapsed * 0.4) * 12 - (mousePosition.x - 50) * 0.015,
        y: 20 + Math.sin(elapsed * 0.6) * 8 - (mousePosition.y - 50) * 0.02
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [mousePosition]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Grid with animation */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px',
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          ></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${15 + (i * 7)}%`,
                top: `${20 + (i * 5) % 60}%`,
                animation: `sparkle ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            ></div>
          ))}
        </div>

        {/* Main Animated Gradient Orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: `${orb1Position.x}%`,
            top: `${orb1Position.y}%`,
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(45deg, 
              rgba(147, 51, 234, 0.3), 
              rgba(59, 130, 246, 0.3), 
              rgba(147, 51, 234, 0.2))`,
            backgroundSize: '200% 200%',
            animation: 'pulse 4s ease-in-out infinite, gradient-shift 8s ease-in-out infinite'
          }}
        ></div>
        
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl transition-all duration-1200 ease-out"
          style={{
            right: `${orb2Position.x}%`,
            bottom: `${orb2Position.y}%`,
            transform: 'translate(50%, 50%)',
            background: `linear-gradient(-45deg, 
              rgba(236, 72, 153, 0.25), 
              rgba(251, 146, 60, 0.25), 
              rgba(168, 85, 247, 0.2))`,
            backgroundSize: '200% 200%',
            animation: 'pulse 5s ease-in-out infinite reverse, gradient-shift 10s ease-in-out infinite reverse'
          }}
        ></div>
        
        {/* Secondary floating orbs */}
        <div 
          className="absolute w-64 h-64 rounded-full blur-2xl"
          style={{
            left: `${30 + Math.sin(Date.now() / 3000) * 10}%`,
            top: `${60 + Math.cos(Date.now() / 4000) * 15}%`,
            background: `radial-gradient(circle, 
              rgba(6, 182, 212, 0.2), 
              rgba(59, 130, 246, 0.15), 
              transparent)`,
            animation: 'float 6s ease-in-out infinite, glow 4s ease-in-out infinite'
          }}
        ></div>
        
        <div 
          className="absolute w-48 h-48 rounded-full blur-2xl"
          style={{
            right: `${25 + Math.cos(Date.now() / 3500) * 8}%`,
            top: `${40 + Math.sin(Date.now() / 2800) * 12}%`,
            background: `radial-gradient(circle, 
              rgba(139, 92, 246, 0.15), 
              rgba(168, 85, 247, 0.1), 
              transparent)`,
            animation: 'float 7s ease-in-out infinite reverse, glow 6s ease-in-out infinite'
          }}
        ></div>

        {/* Subtle accent orbs */}
        <div 
          className="absolute w-32 h-32 rounded-full blur-xl opacity-60"
          style={{
            left: `${60 + Math.sin(Date.now() / 2000) * 5}%`,
            top: `${30 + Math.cos(Date.now() / 2500) * 8}%`,
            background: `radial-gradient(circle, rgba(34, 197, 94, 0.15), transparent)`,
            animation: 'sparkle 8s ease-in-out infinite'
          }}
        ></div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium backdrop-blur-sm">
              Web3 시대의 새로운 명함
            </span>
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent font-pacifico">
              MintMe
            </span>
            <br />
            <span className="text-white/90">Meet the World.</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            AI가 당신의 이력을 분석하여 완벽한 명판 NFT를 생성하고,<br />
            Web3 네트워크 전반에 자동으로 배포합니다.
          </p>

          {/* Wallet Connection Status */}
          {isConnected && connectedAddress ? (
            <div className="bg-white/10 border border-white/20 rounded-3xl p-8 mb-12 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-green-400 font-bold text-lg mb-4 flex items-center justify-center gap-2">
                  <i className="ri-check-line"></i>
                  지갑이 성공적으로 연결되었습니다!
                </p>
                <div className="bg-black/30 p-4 rounded-2xl mb-6">
                  <p className="text-sm text-white/60 mb-2">연결된 주소:</p>
                  <Address address={connectedAddress} />
                  {currentChain && (
                    <div className="mt-3">
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                        {currentChain.name} (ID: {currentChain.id})
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/create" className="group bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-3">
                    {hasProfile ? '프로필 업데이트' : '명판 만들기'}
                    <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                  </Link>
                  <button onClick={() => disconnect()} className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all">
                    연결 해제
                  </button>
                </div>
                
                {/* 컨트랙트 통계 */}
                {totalSupply !== undefined && (
                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                      <i className="ri-group-line text-sm text-white/60"></i>
                      <span className="text-white/80 text-sm">
                        총 {Number(totalSupply)}개의 명판이 생성되었습니다
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-12">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm mb-8">
                <p className="text-white/80 mb-6 text-lg">지갑을 연결하여 시작하세요</p>
                <WalletConnectLogin />
              </div>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/gallery" className="border-2 border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all">
                  갤러리 둘러보기
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-50">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center backdrop-blur-sm bg-black/20">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              3단계로 완성되는 당신만의 Web3 명판
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group cursor-pointer"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`relative bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:border-white/30 ${activeFeature === index ? 'scale-105 border-white/30' : ''}`}>
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                    <i className={`${feature.icon} text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/60 text-lg leading-relaxed">{feature.description}</p>
                  
                  {/* Step Number */}
                  <div className="absolute top-6 right-6 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm font-bold text-white/50">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              명판 미리보기
            </h2>
            <p className="text-xl text-white/60">
              앞뒤 양면으로 제작되는 당신만의 디지털 명함
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative aspect-[5/8] w-80 max-w-sm mx-auto" style={{ perspective: '1000px' }}>
              <div className="relative w-full h-full transform-style-preserve-3d transition-transform duration-700 hover:rotate-y-180" style={{ transformStyle: 'preserve-3d' }}>
                
                {/* Front Side */}
                <div 
                  className="absolute inset-0 backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/50 hover:shadow-white/10 transition-shadow duration-300">
                    
                    {/* Profile Image - Top Half */}
                    <div className="absolute inset-x-0 top-0 h-3/5 rounded-t-3xl overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face" 
                        alt="김개발"
                        className="w-full h-full object-cover opacity-90"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextSibling) {
                            nextSibling.style.display = 'block';
                          }
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-purple-600/80 via-blue-600/80 to-indigo-700/80 flex items-center justify-center" style={{display: 'none'}}>
                        <i className="ri-user-line text-6xl text-white/60"></i>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10"></div>
                    </div>

                    {/* Content Area - Bottom Half */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-white/10 backdrop-blur-lg rounded-b-3xl p-6 text-white border-t border-white/20">
                      <div className="text-center mb-3">
                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">김개발</h3>
                        <p className="text-sm font-medium text-white/90 drop-shadow-md">
                          소프트웨어 디벨로퍼
                        </p>
                      </div>

                      <div className="flex justify-center mb-3">
                        <div className="inline-flex items-center gap-2 bg-green-400/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-300/30">
                          <div className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                          <span className="text-xs font-medium text-green-100">Available</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 justify-center mb-3">
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white border border-white/30">Web3</span>
                        <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white border border-white/30">DeFi</span>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-xs text-white/90">
                        <i className="ri-at-line drop-shadow-md"></i>
                        <span className="truncate drop-shadow-md">@kimdev_eth</span>
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
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/50 hover:shadow-white/10 transition-shadow duration-300">
                    <div className="h-full p-5 flex flex-col text-white">
                      
                      <div className="text-center mb-3">
                        <h4 className="font-bold text-white text-sm mb-1 drop-shadow-lg tracking-tight">소개</h4>
                        <div className="w-8 h-px bg-white/30 mx-auto"></div>
                      </div>
                      
                      <div className="flex-1 mb-3">
                        <p className="text-white/90 text-xs leading-tight tracking-tight line-clamp-6">
                          5년간 블록체인 개발 경험을 바탕으로 DeFi 프로토콜과 NFT 마켓플레이스를 구축해왔습니다. Solidity와 Web3 기술에 특화되어 있습니다.
                        </p>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <span className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/20">Web3</span>
                          <span className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/20">DeFi</span>
                          <span className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/20">NFT</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-white/90">
                          <i className="ri-at-line text-xs"></i>
                          <span className="truncate font-medium tracking-tight">@kimdev_eth</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-white/90">
                          <i className="ri-external-link-line text-xs"></i>
                          <span className="font-medium tracking-tight">portfolio.kimdev.eth</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-50 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-white/50 text-sm">카드에 마우스를 올려보세요</p>
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-5xl lg:text-6xl font-bold text-center mb-16 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Explore MintMe
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/create" className="group">
              <div className="bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 hover:border-white/30 transition-all group-hover:scale-105 min-h-[280px] flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                  <i className="ri-file-add-line text-2xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">명판 만들기</h3>
                <p className="text-white/60 flex-1">
                  당신의 자료를 업로드하고 AI가 전문적인 NFT 명함을 만들어드립니다
                </p>
              </div>
            </Link>

            <Link href="/gallery" className="group">
              <div className="bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 hover:border-white/30 transition-all group-hover:scale-105 min-h-[280px] flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
                  <i className="ri-image-2-line text-2xl text-white"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">갤러리 보기</h3>
                <p className="text-white/60 flex-1">네트워크와 커뮤니티의 NFT 카드를 탐색하고 발견하세요</p>
              </div>
            </Link>

            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-8 rounded-3xl text-white border border-purple-500/30 min-h-[280px] flex flex-col">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <i className="ri-time-line text-2xl text-white"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4">곧 출시 예정</h3>
              <p className="text-purple-100 flex-1">카테고리 별로 분류</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20"></div>
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8 relative z-10">
          <h2 className="text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            지금 시작하세요
          </h2>
          <p className="text-xl text-white/70 mb-12 leading-relaxed">
            몇 분만에 당신만의 Web3 명판을 만들고<br />
            전 세계 네트워크에 자신을 알려보세요
          </p>
          {isConnected ? (
            <Link href="/create" className="inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-full font-bold text-xl hover:bg-white/90 transition-all group">
              명판 만들기
              <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
            </Link>
          ) : (
            <div className="inline-block">
              <WalletConnectLogin />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

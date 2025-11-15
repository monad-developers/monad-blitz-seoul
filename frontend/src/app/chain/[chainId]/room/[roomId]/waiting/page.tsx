'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Play, Crown, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

const chains = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
  solana: { name: 'Solana', symbol: 'SOL', color: 'bg-purple-500' },
  polygon: { name: 'Polygon', symbol: 'MATIC', color: 'bg-indigo-500' },
  arbitrum: { name: 'Arbitrum', symbol: 'ARB', color: 'bg-cyan-500' },
  base: { name: 'Base', symbol: 'BASE', color: 'bg-orange-500' },
  optimism: { name: 'Optimism', symbol: 'OP', color: 'bg-red-500' },
};

// Mock data - 실제로는 WebSocket이나 API로 실시간 업데이트
const mockPlayers = [
  { id: '1', name: 'Player 1', isHost: true },
  { id: '2', name: 'Player 2', isHost: false },
  { id: '3', name: 'Player 3', isHost: false },
  { id: '4', name: 'Player 4', isHost: false },
  { id: '5', name: 'Player 5', isHost: false },
  // { id: '6', name: 'Player 6', isHost: false },
  // { id: '7', name: 'Player 7', isHost: false },
];

export default function WaitingRoom() {
  const router = useRouter();
  const params = useParams();
  const chainId = params.chainId as string;
  const roomId = params.roomId as string;
  const chain = chains[chainId as keyof typeof chains];

  const [players, setPlayers] = useState(mockPlayers);
  const [currentUserId] = useState('1'); // 현재 사용자는 Player 1이라고 가정
  const [isStarting, setIsStarting] = useState(false);

  const currentUser = players.find(p => p.id === currentUserId);
  const isHost = currentUser?.isHost || false;
  const canStartGame = players.length >= 5;

  // 실시간 참가자 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      // 랜덤하게 참가자 추가/제거 시뮬레이션
      if (Math.random() > 0.8 && players.length < 10) {
        const newPlayer = {
          id: Date.now().toString(),
          name: `Player ${players.length + 1}`,
          isHost: false
        };
        setPlayers(prev => [...prev, newPlayer]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [players.length]);

  const handleStartGame = () => {
    if (!canStartGame || !isHost) return;

    setIsStarting(true);
    // 게임 시작 로직
    setTimeout(() => {
      router.push(`/chain/${chainId}/room/${roomId}/game`);
    }, 500);
  };

  const handleLeaveRoom = () => {
    router.push(`/chain/${chainId}/rooms`);
  };

  const getPlayerAvatar = (playerId: string, index: number) => {
    const colors = [
      'bg-[#85E6FF]',
      'bg-[#B9E3F9]',
      'bg-[#FF8EE4]',
      'bg-[#FFAE45]',
    ];

    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E091C] via-[#6E54FF]/20 to-[#000000] p-4">
      <div className="mx-auto max-w-3xl">
        {/* 헤더 */}
        <div className="mb-10">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 text-[#DDD7FE]/80 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            방 목록으로 돌아가기
          </button>

          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Mon Blitz Logo"
              width={200}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`h-16 w-16 rounded-2xl ${chain.color} flex items-center justify-center text-white font-bold text-xl shadow-xl shadow-black/30`}>
                {chain.symbol[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#DDD7FE] bg-clip-text text-transparent mb-1">
                  {chain.name} 게임방
                </h1>
                <p className="text-[#DDD7FE]">방 #{roomId.slice(-4)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-[#DDD7FE] bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 inline-flex">
              <Users className="h-5 w-5" />
              <span className="text-lg font-semibold">
                {players.length}/10 플레이어
              </span>
            </div>
          </div>
        </div>

        {/* 플레이어 그리드 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-8 text-center">
            참가자 목록
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, index) => {
              const player = players[index];

              return (
                <div
                  key={index}
                  className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-all ${
                    player
                      ? 'bg-white/10 border-2 border-white/20 shadow-lg hover:bg-white/15 hover:scale-105'
                      : 'bg-white/5 border-2 border-dashed border-white/10'
                  }`}
                >
                  {player ? (
                    <>
                      {/* 플레이어 아바타 */}
                      <div className={`w-14 h-14 rounded-2xl ${getPlayerAvatar(player.id, index)} flex items-center justify-center text-white font-bold mb-3 shadow-lg`}>
                        {player.name.slice(-1).toUpperCase()}
                      </div>

                      {/* 플레이어 이름 */}
                      <p className="text-white text-sm font-semibold text-center truncate w-full">
                        {player.name}
                      </p>

                      {/* 호스트 표시 */}
                      {player.isHost && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg">
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-[#DDD7FE]/60 text-center">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">대기중</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 게임 시작 버튼 */}
        <div className="text-center">
          {isHost && canStartGame && (
            <button
              onClick={handleStartGame}
              disabled={isStarting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-[#0E091C] disabled:to-[#000000] text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 mx-auto shadow-2xl shadow-green-500/30 hover:shadow-green-500/40 hover:scale-105 disabled:scale-100"
            >
              <Play className="h-6 w-6" />
              {isStarting ? '게임 시작 중...' : '게임 시작하기'}
            </button>
          )}

          {isHost && !canStartGame && (
            <div className="text-[#DDD7FE]/80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 inline-block">
              <p className="mb-2 font-semibold">최소 5명의 플레이어가 필요합니다</p>
              <p className="text-sm text-[#DDD7FE]/60">현재 {players.length}명 참가중</p>
            </div>
          )}

          {!isHost && (
            <div className="text-[#DDD7FE]/80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 inline-block">
              <p className="font-semibold">방장이 게임을 시작할 때까지 기다려주세요</p>
              <p className="text-sm mt-2 text-[#DDD7FE]/60">
                {canStartGame ? '게임 시작 준비 완료!' : `${5 - players.length}명 더 필요합니다`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

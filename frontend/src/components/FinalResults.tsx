import React, { useState } from 'react';
import { Trophy, Medal, Award, Download, RotateCcw } from 'lucide-react';
import Layout, { GridContainer, GridItem, Card, Button } from './Layout';
import { useEvent } from '../contexts/EventContext';
import { useNavigate } from 'react-router-dom';

const FinalResults = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 더미 결과 데이터
  const results = [
    {
      rank: 1,
      prizeName: 'iPhone 15 Pro Max',
      prizeImage: '/item/1st.png',
      winners: [
        { number: 152, name: '김*민' },
        { number: 867, name: '이*주' }
      ]
    },
    {
      rank: 2,
      prizeName: 'AirPods Pro 2세대',
      prizeImage: '/item/2nd.png',
      winners: [
        { number: 23, name: '박*영' },
        { number: 445, name: '최*진' },
        { number: 789, name: '정*수' }
      ]
    },
    {
      rank: 3,
      prizeName: 'Starbucks 기프트카드 (5만원권)',
      prizeImage: '/item/3rd.png',
      winners: [
        { number: 34, name: '홍*동' },
        { number: 156, name: '김*희' },
        { number: 234, name: '이*환' },
        { number: 567, name: '박*진' },
        { number: 890, name: '최*영' }
      ]
    }
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} className="text-yellow-500" />;
      case 2:
        return <Medal size={24} className="text-gray-400" />;
      case 3:
        return <Award size={24} className="text-amber-600" />;
      default:
        return <Award size={24} className="text-purple-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 via-orange-500 to-red-500';
      case 2:
        return 'from-slate-300 via-slate-400 to-slate-500';
      case 3:
        return 'from-amber-600 via-orange-700 to-amber-800';
      default:
        return 'from-purple-400 via-purple-500 to-purple-600';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏆';
    }
  };

  const maskName = (name: string) => {
    if (name.length === 2) return name[0] + '*';
    if (name.length === 3) return name[0] + '*' + name[2];
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <Layout 
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      pageTitle="최종 결과"
    >
      {/* 페이지 헤더 */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Trophy size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🎉 최종 당첨 결과
        </h1>
        <p className="text-base xl:text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
          축하합니다! 응모해주신 모든 분들께 감사드리며, 
          당첨자 분들께는 별도로 연락드릴 예정입니다.
        </p>
      </div>

      {/* 결과 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {results.map((prize) => (
          <Card key={prize.rank} isDarkMode={isDarkMode} hover={false}>
            {/* 등수별 헤더 */}
            <div className={`bg-gradient-to-r ${getRankColor(prize.rank)} rounded-t-xl -mx-6 xl:-mx-8 -mt-6 xl:-mt-8 p-4 xl:p-6 mb-4 xl:mb-6`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">{getRankEmoji(prize.rank)}</span>
                  </div>
                  <div>
                    <h2 className="text-lg xl:text-xl font-bold mb-1">
                      {prize.rank}등 경품
                    </h2>
                    <p className="text-sm xl:text-base text-white/90">{prize.prizeName}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg xl:text-xl font-bold">
                    {prize.winners.length}명
                  </div>
                  <p className="text-white/80 text-xs">당첨</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* 경품 이미지 */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 mb-3">
                  <img
                    src={prize.prizeImage}
                    alt={prize.prizeName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/400x400/6366f1/white?text=${encodeURIComponent(prize.prizeName)}`;
                    }}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                  {prize.prizeName}
                </h3>
              </div>

              {/* 당첨자 목록 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  당첨 번호
                </h4>
                
                <div className="grid grid-cols-2 gap-2">
                  {prize.winners.map((winner, winnerIndex) => (
                    <div
                      key={winnerIndex}
                      className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="text-center">
                        <div className={`text-sm font-bold mb-1 bg-gradient-to-r ${getRankColor(prize.rank)} bg-clip-text text-transparent`}>
                          #{winner.number}
                        </div>
                        {winner.name && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            ({maskName(winner.name)})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 하단 감사 메시지 */}
      <Card isDarkMode={isDarkMode} className="mt-12">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🎊 이벤트 참여 감사합니다!
          </h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-3xl mx-auto">
            당첨자 분들께는 등록해주신 연락처로 개별 안내를 드릴 예정입니다. 
            많은 관심과 참여 부탁드리며, 다음 이벤트에서도 만나뵙기를 기대합니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/event-creation')}
              className="flex items-center justify-center"
            >
              <RotateCcw size={16} className="mr-2" />
              새 이벤트 만들기
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                // 결과 다운로드 로직 (실제로는 CSV 등으로 다운로드)
                const csvContent = results.map(prize => 
                  prize.winners.map(winner => 
                    `${prize.rank},${prize.prizeName},${winner.number},${winner.name}`
                  ).join('\n')
                ).join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = '당첨자_결과.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="flex items-center justify-center"
            >
              <Download size={16} className="mr-2" />
              결과 다운로드
            </Button>
          </div>
        </div>
      </Card>
    </Layout>
  );
};

export default FinalResults;
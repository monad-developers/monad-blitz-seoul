import React, { useState, useEffect } from 'react';

const AnalyticsDashboard = () => {
    const [timeRange, setTimeRange] = useState('24h');
    const [selectedPlatform, setSelectedPlatform] = useState('all');

    // 가상의 분석 데이터
    const [analytics, setAnalytics] = useState({
        totalSearches: 12543,
        activeUsers: 1847,
        rewardsDistributed: 45621,
        searchTrends: [
            { rank: 1, keyword: "AI 도구", searchCount: 1234, growth: "+15%" },
            { rank: 2, keyword: "블록체인", searchCount: 1087, growth: "+8%" },
            { rank: 3, keyword: "Web3", searchCount: 987, growth: "+22%" },
            { rank: 4, keyword: "NFT", searchCount: 876, growth: "-5%" },
            { rank: 5, keyword: "DeFi", searchCount: 765, growth: "+12%" },
            { rank: 6, keyword: "메타버스", searchCount: 654, growth: "+3%" },
            { rank: 7, keyword: "암호화폐", searchCount: 543, growth: "+18%" },
            { rank: 8, keyword: "스마트컨트랙트", searchCount: 432, growth: "+7%" },
            { rank: 9, keyword: "DAO", searchCount: 321, growth: "+25%" },
            { rank: 10, keyword: "GameFi", searchCount: 210, growth: "+45%" }
        ],
        platformStats: [
            { platform: "커머스몰", searches: 4521, percentage: 36, users: 678 },
            { platform: "OTT 서비스", searches: 3876, percentage: 31, users: 543 },
            { platform: "뉴스 포털", searches: 2543, percentage: 20, users: 432 },
            { platform: "소셜 미디어", searches: 1603, percentage: 13, users: 194 }
        ],
        userAnalysis: {
            anonymousUsers: 42,
            walletUsers: 58,
            totalRewards: 45621,
            avgRewardPerUser: 24.7
        }
    });

    useEffect(() => {
        // 실시간 데이터 업데이트 시뮬레이션
        const interval = setInterval(() => {
            setAnalytics(prev => ({
                ...prev,
                totalSearches: prev.totalSearches + Math.floor(Math.random() * 5),
                activeUsers: prev.activeUsers + Math.floor(Math.random() * 3) - 1,
                rewardsDistributed: prev.rewardsDistributed + Math.floor(Math.random() * 50)
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);
    return (
        <div className="max-w-6xl mx-auto p-4 bg-gray-100 font-sans">
            {/* Header Section */}
            <header className="bg-white shadow-md rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">TrendLink Analytics Dashboard</h1>
                        <p className="text-gray-600 mt-1">실시간 검색 트렌드 및 사용자 활동 분석</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Time Range Selector */}
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="1h">최근 1시간</option>
                            <option value="24h">최근 24시간</option>
                            <option value="7d">최근 7일</option>
                            <option value="30d">최근 30일</option>
                        </select>
                        
                        {/* Platform Filter */}
                        <select 
                            value={selectedPlatform} 
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">모든 플랫폼</option>
                            <option value="commerce">커머스몰</option>
                            <option value="ott">OTT 서비스</option>
                            <option value="news">뉴스 포털</option>
                            <option value="social">소셜 미디어</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Statistics Section */}
            <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">📊 실시간 통계</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-blue-800">총 검색 수</h3>
                                <p className="text-3xl font-bold text-blue-900">{analytics.totalSearches.toLocaleString()}</p>
                                <span className="text-sm text-blue-600">+12% 증가</span>
                            </div>
                            <div className="text-blue-500 text-2xl">🔍</div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-green-800">활성 사용자</h3>
                                <p className="text-3xl font-bold text-green-900">{analytics.activeUsers.toLocaleString()}</p>
                                <span className="text-sm text-green-600">+8% 증가</span>
                            </div>
                            <div className="text-green-500 text-2xl">👥</div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-yellow-800">보상 분배</h3>
                                <p className="text-3xl font-bold text-yellow-900">{analytics.rewardsDistributed.toLocaleString()}</p>
                                <span className="text-sm text-yellow-600">TRD 토큰</span>
                            </div>
                            <div className="text-yellow-500 text-2xl">💰</div>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-purple-800">플랫폼 수</h3>
                                <p className="text-3xl font-bold text-purple-900">{analytics.platformStats.length}</p>
                                <span className="text-sm text-purple-600">연동 중</span>
                            </div>
                            <div className="text-purple-500 text-2xl">🏪</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trends Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <section className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">🔥 실시간 검색 트렌드 TOP 10</h2>
                    <div className="space-y-3">
                        {analytics.searchTrends.map((trend, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        index < 3 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'
                                    }`}>
                                        {trend.rank}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{trend.keyword}</p>
                                        <p className="text-sm text-gray-600">{trend.searchCount.toLocaleString()} 검색</p>
                                    </div>
                                </div>
                                <div className={`text-sm font-semibold ${
                                    trend.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {trend.growth}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                <section className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">🏪 플랫폼별 검색 현황</h2>
                    <div className="space-y-4">
                        {analytics.platformStats.map((platform, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-gray-800">{platform.platform}</h3>
                                    <span className="text-sm text-gray-600">{platform.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${platform.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{platform.searches.toLocaleString()} 검색</span>
                                    <span>{platform.users.toLocaleString()} 사용자</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* User Analysis Section */}
            <section className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">👤 사용자 분석</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">사용자 유형 분포</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                                    <span className="text-gray-700">익명 사용자</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold text-gray-800">{analytics.userAnalysis.anonymousUsers}%</span>
                                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                        <div 
                                            className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${analytics.userAnalysis.anonymousUsers}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-700">지갑 연결 사용자</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold text-gray-800">{analytics.userAnalysis.walletUsers}%</span>
                                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${analytics.userAnalysis.walletUsers}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">보상 통계</h3>
                        <div className="space-y-3">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-green-700">총 분배 보상</p>
                                <p className="text-2xl font-bold text-green-800">{analytics.userAnalysis.totalRewards.toLocaleString()} TRD</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-700">사용자당 평균 보상</p>
                                <p className="text-2xl font-bold text-blue-800">{analytics.userAnalysis.avgRewardPerUser} TRD</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">💡 인사이트</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• 지갑 연결 사용자가 평균적으로 2.3배 더 많은 검색을 수행합니다</li>
                        <li>• 최근 7일간 GameFi 관련 검색이 45% 증가했습니다</li>
                        <li>• 커머스몰 플랫폼에서 가장 높은 사용자 참여율을 보입니다</li>
                        <li>• 오후 2-4시 사이에 검색 활동이 가장 활발합니다</li>
                    </ul>
                </div>
            </section>
        </div>
    );
};

export default AnalyticsDashboard;

import React, { useState, useEffect } from 'react';
import NationalAssemblyService from '../services/NationalAssemblyService.js';
import TrendLinkContractService from '../services/TrendLinkContractService.js';
import Web3AuthService from '../services/Web3AuthService.js';

const MainWidget = () => {
    // 검색 관련 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    
    // 블록체인 관련 상태
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [blockchainEnabled, setBlockchainEnabled] = useState(false);
    const [userRewards, setUserRewards] = useState(null);
    const [searchLogsOnChain, setSearchLogsOnChain] = useState([]);
    
    // 국회의원 검색 서비스 인스턴스
    const nationalAssemblyService = new NationalAssemblyService();
    
    // 트렌딩 키워드 상태
    const [trendingKeywords, setTrendingKeywords] = useState([
        { keyword: "겨울 여행", count: 1234, trend: "up" },
        { keyword: "크리스마스 선물", count: 1087, trend: "up" },
        { keyword: "연말 모임", count: 987, trend: "down" },
        { keyword: "새해 계획", count: 876, trend: "up" },
        { keyword: "스키장 추천", count: 765, trend: "steady" }
    ]);

    // 컴포넌트 마운트 시 지갑 연결 상태 확인
    useEffect(() => {
        checkWalletConnection();
        
        // 정기적으로 지갑 연결 상태 확인 (3초마다)
        const interval = setInterval(() => {
            checkWalletConnection();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // 지갑 연결 상태 확인
    const checkWalletConnection = async () => {
        try {
            // MetaMask 설치 여부 확인
            if (!Web3AuthService.isMetaMaskInstalled()) {
                console.log('MetaMask not installed');
                setIsWalletConnected(false);
                return;
            }

            // 직접 ethereum 객체에서 계정 확인
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    console.log('Direct ethereum accounts check:', accounts);
                    
                    const connected = accounts && accounts.length > 0;
                    setIsWalletConnected(connected);
                    
                    if (connected) {
                        console.log('Wallet connected with account:', accounts[0]);
                    } else {
                        console.log('No accounts found');
                    }
                } catch (error) {
                    console.error('Direct ethereum check failed:', error);
                    setIsWalletConnected(false);
                }
            } else {
                console.log('No ethereum object found');
                setIsWalletConnected(false);
            }
        } catch (error) {
            console.error('Wallet connection check failed:', error);
            setIsWalletConnected(false);
        }
    };

    // 사용자 보상 정보 로드
    const loadUserRewards = async () => {
        try {
            const rewards = await TrendLinkContractService.getUserRewards();
            setUserRewards(rewards);
        } catch (error) {
            console.error('Load user rewards failed:', error);
        }
    };

    // 사용자 검색 로그 로드
    const loadUserSearchLogs = async () => {
        try {
            const logs = await TrendLinkContractService.getUserSearchLogs();
            setSearchLogsOnChain(logs);
        } catch (error) {
            console.error('Load user search logs failed:', error);
        }
    };

    // 검색 함수 (블록체인 통합)
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        
        try {
            // 국회의원 검색
            const assemblyResults = await nationalAssemblyService.searchMember(searchQuery, 1, 10);
            const results = assemblyResults.success ? assemblyResults.data : [];
            
            setSearchResults(results);
            
            // 검색 히스토리에 추가
            setSearchHistory(prev => [
                { 
                    query: searchQuery, 
                    timestamp: new Date().toLocaleString(),
                    resultCount: results.length
                },
                ...prev.slice(0, 4) // 최대 5개만 유지
            ]);

            // 블록체인에 검색 로그 기록 (지갑 연결된 경우)
            if (isWalletConnected && blockchainEnabled) {
                await logSearchToBlockchain(searchQuery);
            }
            
            // 검색 결과 팝업 표시
            setShowResultModal(true);
            
        } catch (error) {
            console.error('Search failed:', error);
            alert('검색에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSearching(false);
        }
    };

    // 국회의원 선택 핸들러
    const handleMemberSelect = (member) => {
        setSelectedMember(member);
        setShowResultModal(false);
    };

    // 블록체인에 검색 로그 기록
    const logSearchToBlockchain = async (keyword) => {
        try {
            console.log('Logging search to blockchain:', keyword);
            const result = await TrendLinkContractService.logSearch(keyword);
            
            if (result.success) {
                console.log('Search logged successfully:', result.transactionHash);
                // 사용자 보상 정보 업데이트
                setTimeout(() => {
                    loadUserRewards();
                    loadUserSearchLogs();
                }, 3000); // 3초 후 업데이트 (트랜잭션 완료 대기)
            } else {
                console.error('Search logging failed:', result.error);
            }
        } catch (error) {
            console.error('Blockchain logging failed:', error);
        }
    };

    // 검색 함수
    const handleSearch_old = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        
        try {
            let results = [];
            
            // 네이버 검색 API 호출
            switch (searchType) {
                case 'blog':
                    results = await naverSearch.searchAll(searchQuery, 10);
                    break;
                case 'news':
                    results = await naverSearch.searchNews(searchQuery, 10);
                    break;
                case 'web':
                    results = await naverSearch.searchWeb(searchQuery, 10);
                    break;
                case 'integrated':
                default:
                    results = await naverSearch.searchIntegrated(searchQuery);
                    break;
            }
            
            setSearchResults(results);
            
            // 검색 히스토리에 추가
            setSearchHistory(prev => [
                { 
                    query: searchQuery, 
                    timestamp: new Date().toLocaleString(),
                    type: searchType,
                    resultCount: results.length
                },
                ...prev.slice(0, 4) // 최대 5개만 유지
            ]);
            
        } catch (error) {
            console.error('Search failed:', error);
            alert('검색에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSearching(false);
        }
    };

    // 트렌딩 키워드 클릭 핸들러
    const handleTrendingClick = (keyword) => {
        setSearchQuery(keyword);
        // 자동 검색 실행
        setTimeout(() => {
            const fakeEvent = { preventDefault: () => {} };
            handleSearch(fakeEvent);
        }, 100);
    };
    return (
        <div className="max-w-4xl mx-auto p-4 bg-gray-100 font-sans">
            {/* Header Section */}
            <header className="bg-white shadow-md rounded-lg p-6 mb-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">TrendLink Search Widget</h1>
                    <p className="text-gray-600 mt-2">검색하고 트렌드를 발견하세요</p>
                </div>
            </header>

            {/* Blockchain Status Section */}
            <section className="bg-white shadow-md rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isWalletConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm font-medium">
                                {isWalletConnected ? '지갑 연결됨' : '지갑 연결 안됨'}
                            </span>
                            {isWalletConnected && (
                                <span className="text-xs text-gray-500">
                                    (MetaMask)
                                </span>
                            )}
                        </div>
                        
                        {isWalletConnected && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">블록체인 기능:</span>
                                <button
                                    onClick={() => setBlockchainEnabled(!blockchainEnabled)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                        blockchainEnabled 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {blockchainEnabled ? '활성' : '비활성'}
                                </button>
                            </div>
                        )}
                        
                        {!isWalletConnected && (
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                                Wallet Connect 탭에서 연결
                            </button>
                        )}
                    </div>
                    
                    {isWalletConnected && userRewards && (
                        <div className="text-sm">
                            <span className="text-gray-600">누적 보상: </span>
                            <span className="font-semibold text-green-600">{userRewards.totalReward} ETH</span>
                        </div>
                    )}
                </div>
                
                {blockchainEnabled && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            🔗 블록체인 기능이 활성화되었습니다. 검색할 때마다 온체인 로그가 기록되고 보상이 지급됩니다.
                        </p>
                    </div>
                )}
            </section>

            {/* 선택된 국회의원 정보 섹션 */}
            {selectedMember && (
                <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">🏛️ 선택된 국회의원 정보</h2>
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="text-gray-500 hover:text-gray-700 text-xl"
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                        {selectedMember.photo && (
                            <img 
                                src={selectedMember.photo} 
                                alt={selectedMember.name}
                                className="w-32 h-40 object-cover rounded-lg shadow-md"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                        
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                                <h3 className="text-3xl font-bold text-gray-900">{selectedMember.name}</h3>
                                {selectedMember.party && (
                                    <span className="inline-block px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
                                        {selectedMember.party}
                                    </span>
                                )}
                                {selectedMember.position && (
                                    <span className="inline-block px-4 py-2 text-sm bg-green-100 text-green-800 rounded-full font-medium">
                                        {selectedMember.position}
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">선거구:</span>
                                        <span className="text-gray-800">{selectedMember.constituency || '정보 없음'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">위원회:</span>
                                        <span className="text-gray-800">{selectedMember.committee || '정보 없음'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">당선대수:</span>
                                        <span className="text-gray-800">{selectedMember.termNumber || '정보 없음'}선</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">연락처:</span>
                                        <span className="text-gray-800">{selectedMember.phoneNumber || '정보 없음'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">이메일:</span>
                                        <span className="text-gray-800">{selectedMember.email || '정보 없음'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">사무실:</span>
                                        <span className="text-gray-800">{selectedMember.officeRoom || '정보 없음'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedMember.profile && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">약력</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        {selectedMember.profile}
                                    </p>
                                </div>
                            )}
                            
                            <div className="mt-6 flex space-x-4">
                                {selectedMember.homepage && (
                                    <a 
                                        href={selectedMember.homepage} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        🔗 홈페이지 방문
                                    </a>
                                )}
                                
                                {selectedMember.email && (
                                    <a 
                                        href={`mailto:${selectedMember.email}`}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        📧 이메일 보내기
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Search Section */}
            <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                <form onSubmit={handleSearch} className="flex items-center space-x-4">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="국회의원 이름을 입력하세요... (예: 김영삼, 이재명)" 
                        className="flex-grow border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSearching}
                    />
                    <button 
                        type="submit" 
                        disabled={isSearching || !searchQuery.trim()}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSearching ? '검색 중...' : '🏛️ 국회의원 검색'}
                    </button>
                </form>
            </section>

            {/* Search History */}
            {searchHistory.length > 0 && (
                <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">📝 최근 검색 기록</h2>
                    <div className="space-y-3">
                        {searchHistory.map((search, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex-1">
                                    <span 
                                        className="text-gray-800 cursor-pointer hover:text-blue-600 font-medium"
                                        onClick={() => handleTrendingClick(search.query)}
                                    >
                                        {search.query}
                                    </span>
                                    <div className="flex items-center space-x-4 mt-1">
                                        <span className="text-xs text-gray-500">{search.timestamp}</span>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            국회의원 검색
                                        </span>
                                        <span className="text-xs text-gray-500">{search.resultCount}개 결과</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Section */}
            <section className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">🔥 실시간 트렌딩 검색어</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trendingKeywords.map((item, index) => (
                        <div 
                            key={index} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border-l-4 border-blue-500"
                            onClick={() => handleTrendingClick(item.keyword)}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-xl font-bold text-blue-600">#{index + 1}</span>
                                <span className="text-gray-800 font-medium">{item.keyword}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">{item.count.toLocaleString()}</span>
                                <span className={`text-lg ${
                                    item.trend === 'up' ? 'text-green-500' : 
                                    item.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                                }`}>
                                    {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 검색 결과 모달 */}
            {showResultModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-800">
                                🏛️ 국회의원 검색 결과 ({searchResults.length}개)
                            </h3>
                            <button 
                                onClick={() => setShowResultModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {searchResults.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {searchResults.map((member, index) => (
                                        <div 
                                            key={member.code || index} 
                                            className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleMemberSelect(member)}
                                        >
                                            <div className="flex items-start space-x-4">
                                                {member.photo && (
                                                    <img 
                                                        src={member.photo} 
                                                        alt={member.name}
                                                        className="w-20 h-24 object-cover rounded-md"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <h4 className="text-2xl font-bold text-gray-900">{member.name}</h4>
                                                        {member.party && (
                                                            <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                                                                {member.party}
                                                            </span>
                                                        )}
                                                        {member.position && (
                                                            <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                                                                {member.position}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div className="space-y-2">
                                                            <p className="text-gray-600"><strong>선거구:</strong> {member.constituency || '정보 없음'}</p>
                                                            <p className="text-gray-600"><strong>위원회:</strong> {member.committee || '정보 없음'}</p>
                                                            <p className="text-gray-600"><strong>당선대수:</strong> {member.termNumber || '정보 없음'}선</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <p className="text-gray-600"><strong>연락처:</strong> {member.phoneNumber || '정보 없음'}</p>
                                                            <p className="text-gray-600"><strong>이메일:</strong> {member.email || '정보 없음'}</p>
                                                            <p className="text-gray-600"><strong>사무실:</strong> {member.officeRoom || '정보 없음'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {member.profile && (
                                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-sm text-gray-700">
                                                                <strong>약력:</strong> {member.profile.substring(0, 300)}...
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {member.homepage && (
                                                        <div className="mt-3">
                                                            <a 
                                                                href={member.homepage} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                            >
                                                                🔗 홈페이지 바로가기
                                                            </a>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                                        <p className="text-sm text-gray-500 text-center">
                                                            👆 클릭하면 상세 정보를 확인할 수 있습니다
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainWidget;

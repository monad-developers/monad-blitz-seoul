import { useState, useEffect } from 'react';
import { Users, Clock, Trophy, ExternalLink, Copy, CheckCircle, Eye, StopCircle } from 'lucide-react';
import Layout, { Card, Button } from './Layout';
import { useEvent } from '../contexts/EventContext';
import { useNavigate } from 'react-router-dom';

const EntryStatus = () => {
  const navigate = useNavigate();
  const { eventData, updateEventData } = useEvent();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWarning, setShowWarning] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 더미 데이터
  const [entryCount, setEntryCount] = useState(1247);
  
  // 이벤트 종료 시간 계산
  const getEventEndTime = () => {
    if (!eventData?.endDate || !eventData?.endHour || !eventData?.endMinute) {
      // 기본값: 현재 시간으로부터 2시간 후
      const now = new Date();
      return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }
    const endTime = new Date(`${eventData.endDate}T${eventData.endHour}:${eventData.endMinute}:00`);
    return endTime.toISOString();
  };

  const eventStatus = {
    currentEntries: entryCount,
    endTime: getEventEndTime(),
    isActive: true,
    entryUrl: 'https://monad.app/entry/abc123'
  };

  // 1초마다 현재 시간 업데이트하고 가끔 응모자 수도 증가
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // 5초마다 랜덤하게 응모자 수 증가
      if (Math.random() < 0.2) {
        setEntryCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = () => {
    const endTime = new Date(eventStatus.endTime);
    const now = currentTime;
    const timeDiff = endTime.getTime() - now.getTime();
  // 중복 선언 제거: 아무것도 하지 않음
    if (timeDiff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
  };

  const formatCurrentTime = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatEndTime = () => {
    const endTime = new Date(eventStatus.endTime);
    const month = endTime.getMonth() + 1;
    const day = endTime.getDate();
    const hours = endTime.getHours();
    const minutes = endTime.getMinutes();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${month}월 ${day}일 ${period} ${displayHour}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleQRClick = () => {
    // eventId는 useEvent().eventData에서 받아옴 (id가 없으면 경고)
    // eventData에 id가 없으면 undefined 전달
    navigate('/qr-page', { state: { eventId: (eventData as any).id } });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventStatus.entryUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleFinalResultClick = () => {
    const timeRemaining = getTimeRemaining();
    if (!timeRemaining.isExpired) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    } else {
      navigate('/final-results');
    }
  };

  const handleCloseEvent = () => {
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentDate = now.toISOString().split('T')[0];
    
    updateEventData({
      endDate: currentDate,
      endHour: currentHour,
      endMinute: currentMinute
    });
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Layout 
      isDarkMode={isDarkMode}
      pageTitle="응모 현황"
    >
      {/* 페이지 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          응모 현황을 확인하세요
        </h1>
        <p className="text-base xl:text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
          실시간으로 업데이트되는 응모 현황과 QR 코드를 통해 
          <br />
          참가자들이 쉽게 이벤트에 참여할 수 있도록 도와주세요.
        </p>
      </div>

      {/* 상단 좌우 배치 + 하단 전체 너비 */}
      <div className="space-y-8">
        {/* 상단: QR 이동 + 현황 컴포넌트 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR 페이지 이동 섹션 */}
          <Card isDarkMode={isDarkMode} className="h-full">
            <div className="text-center">
              <h2 className="text-xl xl:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                QR 페이지 이동
              </h2>
              
              {/* QR 코드 */}
              <div 
                onClick={handleQRClick}
                className="relative group cursor-pointer mx-auto mb-6"
                style={{ width: 'fit-content' }}
              >
                <div className="w-60 h-60 bg-white rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 group-hover:scale-105 transition-all duration-300">
                  <div className="w-full h-full bg-white rounded-lg flex items-center justify-center relative overflow-hidden">
                    {/* Simple QR Code Pattern */}
                    <div className="w-48 h-48 bg-black relative">
                      {/* 코너 마커들 */}
                      <div className="absolute top-1 left-1 w-8 h-8 border-2 border-black bg-white">
                        <div className="w-2 h-2 bg-black m-1.5"></div>
                      </div>
                      <div className="absolute top-1 right-1 w-8 h-8 border-2 border-black bg-white">
                        <div className="w-2 h-2 bg-black m-1.5"></div>
                      </div>
                      <div className="absolute bottom-1 left-1 w-8 h-8 border-2 border-black bg-white">
                        <div className="w-2 h-2 bg-black m-1.5"></div>
                      </div>
                      
                      {/* QR 패턴 시뮬레이션 */}
                      <div className="absolute inset-3 grid grid-cols-12 gap-px">
                        {Array.from({ length: 144 }, (_, i) => {
                          const shouldShow = Math.random() > 0.4;
                          return (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 ${shouldShow ? 'bg-white' : 'bg-black'}`}
                            />
                          );
                        })}
                      </div>
                      
                      {/* 중앙 로고 */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded border border-black flex items-center justify-center">
                        <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs font-bold">
                          M
                        </div>
                      </div>
                    </div>
                    
                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
                      <ExternalLink className="text-black opacity-0 group-hover:opacity-80 transition-all duration-300" size={20} />
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
                  클릭하여 QR 페이지로 이동
                </p>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle size={14} />
                      <span>복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>링크 복사</span>
                    </>
                  )}
                </button>
                
                <a
                  href={`/qr-page?eventId=${encodeURIComponent((eventData as any).id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm"
                >
                  <Eye size={14} />
                  <span>QR 페이지 보기</span>
                </a>
              </div>
            </div>
          </Card>

          {/* 실시간 현황 섹션 */}
          <Card isDarkMode={isDarkMode} className="h-full">
            <h2 className="text-xl xl:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 text-center">
              실시간 현황
            </h2>
            
            <div className="flex flex-col justify-between items-center gap-4">
              {/* 현재 시간 */}
              <div className="text-center py-4 w-full">
                <div className="text-xl font-mono font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrentTime()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  현재 시간
                </div>
              </div>

              {/* 현재 응모 인원 */}
              <div className="text-center py-4 w-full">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <Users size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">응모 인원</span>
                </div>
                
                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-1">
                  {eventStatus.currentEntries.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">명</div>
                <div className="mt-1 flex items-center justify-center space-x-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">실시간</span>
                </div>
              </div>

              {/* 응모 종료 시간 */}
              <div className="text-center py-4 w-full">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <Clock size={12} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">종료 시간</span>
                </div>
                
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {formatEndTime()}
                </div>
                
                {timeRemaining.isExpired ? (
                  <div className="text-red-500 font-semibold text-sm">
                    응모 종료
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">남은 시간</div>
                    <div className="flex justify-center space-x-1 text-sm font-mono font-bold">
                      <div className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded text-xs">
                        {timeRemaining.hours.toString().padStart(2, '0')}
                      </div>
                      <span className="text-gray-400 text-xs">:</span>
                      <div className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded text-xs">
                        {timeRemaining.minutes.toString().padStart(2, '0')}
                      </div>
                      <span className="text-gray-400 text-xs">:</span>
                      <div className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded text-xs">
                        {timeRemaining.seconds.toString().padStart(2, '0')}
                      </div>
                    </div>
                    
                    {/* 응모 마감하기 버튼 */}
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={handleCloseEvent}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 hover:shadow-md text-sm"
                      >
                        <StopCircle size={14} />
                        <span>응모 마감하기</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* 하단: 최종 결과 확인 컴포넌트 */}
        <Card isDarkMode={isDarkMode}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <Trophy size={16} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">최종 결과</h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant={timeRemaining.isExpired ? "primary" : "outline"}
                size="md"
                onClick={handleFinalResultClick}
                disabled={!timeRemaining.isExpired}
              >
                최종 결과 확인
              </Button>
              
              {!timeRemaining.isExpired && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  응모 종료 후 결과를 확인할 수 있습니다
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 하단 네비게이션 */}
      <div className="mt-12 flex justify-center space-x-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate('/field-settings')}
        >
          이전으로
        </Button>
      </div>

      {/* 경고 메시지 모달 */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              응모가 아직 종료되지 않았습니다!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              응모 종료 후 최종 결과를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EntryStatus;
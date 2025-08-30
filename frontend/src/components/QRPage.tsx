import React, { useState, useEffect } from 'react';
import { Users, Clock, Hourglass, QrCode } from 'lucide-react';
import Layout, { GridContainer, GridItem, Card } from './Layout';
import { useLocation } from 'react-router-dom';

const QRPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 라우터에서 eventId 전달받기 (useLocation)
  const location = useLocation();
  const eventId = location.state?.eventId;

  // 실제 이벤트 데이터 (더미 제거, 추후 API 연동 가능)
  const [entryCount, setEntryCount] = useState(1247);
  const [eventData] = useState({
    eventName: '이벤트',
    endDate: '2025-01-31',
    endTime: '18:00',
  });

  // QR 이미지 URL
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      setQrUrl(`/api/events/${eventId}/qr`);
    } else {
      setQrUrl(null);
    }
  }, [eventId]);
  
  // 1초마다 현재 시간 업데이트하고 가끔 응모자 수도 증가
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // 3초마다 랜덤하게 응모자 수 증가
      if (Math.random() < 0.33) {
        setEntryCount(prev => prev + Math.floor(Math.random() * 2) + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = () => {
    const endTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`);
    const now = currentTime;
    const timeDiff = endTime.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, isExpired: false };
  };

  // QR 코드 패턴 생성 함수
  const generateQRPattern = () => {
    const size = 25;
    const pattern = [];
    
    for (let row = 0; row < size; row++) {
      pattern[row] = [];
      for (let col = 0; col < size; col++) {
        // 파인더 패턴 (코너 3개)
        const isFinderPattern = 
          (row < 9 && col < 9) || // 좌상
          (row < 9 && col > 15) || // 우상
          (row > 15 && col < 9);   // 좌하
        
        if (isFinderPattern) {
          // 파인더 패턴 생성
          const localRow = row < 9 ? row : row - 16;
          const localCol = col < 9 ? col : (col > 15 ? col - 16 : col);
          
          pattern[row][col] = 
            (localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6) ||
            (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4);
            
        } else if (row === 6 || col === 6) {
          // 타이밍 패턴 (교대로 검정/흰색)
          pattern[row][col] = (row + col) % 2 === 0;
          
        } else {
          // 데이터 영역 - 시드 기반 패턴
          const seed = (row * size + col) * 12345;
          pattern[row][col] = (seed % 100) < 45;
        }
      }
    }
    
    return pattern;
  };

  const formatCurrentTime = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${period} ${displayHour}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCurrentDate = () => {
    const now = currentTime;
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];
    
    return `${year}년 ${month}월 ${day}일 (${weekDay})`;
  };

  const formatEndTime = () => {
    const endTime = new Date(`${eventData.endDate}T${eventData.endTime}:00`);
    const month = endTime.getMonth() + 1;
    const day = endTime.getDate();
    const [hour, minute] = eventData.endTime.split(':');
    const hours = parseInt(hour);
    const period = hours < 12 ? '오전' : '오후';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${month}월 ${day}일 ${period} ${displayHour}:${minute}`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 transform rotate-12 scale-150"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-blue-400/20 to-cyan-400/20 transform -rotate-12 scale-150"></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="relative min-h-screen flex flex-col">
        <Layout 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          pageTitle="QR 페이지"
          className="flex-1 flex items-center justify-center"
        >
          <GridContainer gap="xl" className="min-h-[80vh] items-center">
            {/* QR 메인 영역 - 8컬럼 */}
            <GridItem colSpan={{ xl: 8 }}>
              <div className="text-center space-y-12">
                {/* 이벤트 제목과 시간 정보 */}
                <div>
                  <h1 className="text-4xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
                    {eventData.eventName}
                  </h1>
                  
                  {/* 날짜와 현재 시간 */}
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-8 text-xl text-gray-600 dark:text-gray-300">
                    <div className="flex flex-col items-center">
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400 mb-2">날짜</span>
                      <span className="font-semibold text-2xl">{formatCurrentDate()}</span>
                    </div>
                    <div className="hidden lg:block w-px h-16 bg-gray-300 dark:bg-gray-600"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-base font-medium text-gray-500 dark:text-gray-400 mb-2">현재시간</span>
                      <span className="font-mono font-semibold text-2xl">{formatCurrentTime()}</span>
                    </div>
                  </div>
                </div>

                {/* 실제 QR 이미지 */}
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="w-96 h-96 bg-white rounded-2xl p-6 shadow-2xl border-4 border-white dark:border-gray-200 group-hover:scale-105 transition-all duration-500 flex items-center justify-center">
                      {eventId ? (
                        qrUrl ? (
                          <img
                            src={qrUrl}
                            alt="이벤트 QR 코드"
                            className="w-80 h-80 object-contain rounded-xl border border-gray-200"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-80 h-80 flex items-center justify-center text-gray-400">QR 이미지를 불러오는 중...</div>
                        )
                      ) : (
                        <div className="w-80 h-80 flex items-center justify-center text-gray-400">eventId가 없습니다. QR 이미지를 표시할 수 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR 설명 */}
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <QrCode size={32} className="text-purple-600" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        응모 참여 방법
                      </h2>
                    </div>
                    <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                      스마트폰 카메라로 위의 QR 코드를 스캔하여 
                      <br className="hidden sm:block" />
                      경품 응모에 참여하세요!
                    </p>
                  </div>
                </div>

                {/* 참여 단계 안내 */}
                <div className="max-w-4xl mx-auto">
                  <div className="auto-grid-3">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
                        1
                      </div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                        QR 코드 스캔
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
                        2
                      </div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                        정보 입력
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
                        3
                      </div>
                      <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
                        응모 완료
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </GridItem>

            {/* 실시간 현황 사이드바 - 4컬럼 */}
            <GridItem colSpan={{ xl: 4 }}>
              <div className="space-y-6">
                {/* 현재 시간 (실시간) */}
                <Card isDarkMode={isDarkMode} className="text-center py-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/50 dark:border-gray-700/50">
                  <div className="text-3xl font-mono font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formatCurrentTime()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    실시간 업데이트
                  </div>
                </Card>

                {/* 현재 응모 인원 */}
                <Card isDarkMode={isDarkMode} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">현재 응모</h3>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
                      {entryCount.toLocaleString()}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">명</div>
                    <div className="mt-3 flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Live</span>
                    </div>
                  </div>
                </Card>

                {/* 응모 종료 시간 */}
                <Card isDarkMode={isDarkMode} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">응모 종료</h3>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {formatEndTime()}
                    </div>
                  </div>
                </Card>

                {/* 남은 시간 */}
                <Card isDarkMode={isDarkMode} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                      <Hourglass size={20} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">남은 시간</h3>
                  </div>
                  
                  <div className="text-center">
                    {timeRemaining.isExpired ? (
                      <div className="text-xl font-bold text-red-500">
                        응모 마감
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-300 font-mono">
                              {timeRemaining.hours.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">시간</div>
                          </div>
                          <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-300 font-mono">
                              {timeRemaining.minutes.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">분</div>
                          </div>
                          <div className="bg-orange-100 dark:bg-orange-900 rounded-lg p-3">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-300 font-mono">
                              {timeRemaining.seconds.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">초</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 상태 표시 */}
                <div className="text-center">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                    timeRemaining.isExpired 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      timeRemaining.isExpired ? 'bg-red-500' : 'bg-green-500 animate-pulse'
                    }`}></div>
                    <span>{timeRemaining.isExpired ? '응모 마감' : '응모 진행 중'}</span>
                  </div>
                </div>
              </div>
            </GridItem>
          </GridContainer>
        </Layout>
      </div>
    </div>
  );
};

export default QRPage;
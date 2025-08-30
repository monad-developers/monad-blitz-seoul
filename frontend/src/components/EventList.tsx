import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Plus, Search, Filter, MoreVertical, ChevronDown } from 'lucide-react';
import Layout, { Card, Button } from './Layout';
import { useNavigate } from 'react-router-dom';
import { getMyEvents } from '../services/api';

const EventList = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // API에서 불러온 이벤트 데이터
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('adminToken') || '';
        const data = await getMyEvents(token);
        setEvents(data);
      } catch (e: any) {
        setError('이벤트 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'ended':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'upcoming':
        return '예정';
      case 'ended':
        return '종료';
      case 'draft':
        return '임시저장';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const filteredEvents = events.filter(event => {
    // 백엔드 필드명에 맞게 매핑 (title, organization 등은 없을 수 있음)
    const title = event.name || event.title || '';
    const organization = event.organization || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         organization.toLowerCase().includes(searchTerm.toLowerCase());
    // status 필드는 없을 수 있으니 기본값 처리
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleEventClick = (eventId: number) => {
    // 모든 이벤트 클릭 시 event-creation으로 이동 (목업 단계)
    navigate('/event-creation');
  };

  const handleCreateEvent = () => {
    navigate('/event-creation');
  };

  if (loading) {
    return <div className="p-8 text-center text-lg">이벤트 목록을 불러오는 중...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  return (
    <Layout 
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      pageTitle="이벤트 목록"
    >
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              내 이벤트 목록
            </h1>
            <p className="text-base xl:text-lg text-gray-600 dark:text-gray-300">
              관리하고 있는 이벤트들을 확인하고 관리하세요.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateEvent}
            className="w-full lg:w-auto flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" />
            새 이벤트 만들기
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <Card isDarkMode={isDarkMode} className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="이벤트명 또는 기관명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </div>
          </div>
          
                     {/* 필터 */}
           <div className="lg:w-48">
             <div className="relative">
               <select
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value)}
                 className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors appearance-none"
               >
                 <option value="all">전체 상태</option>
                 <option value="active">진행중</option>
                 <option value="upcoming">예정</option>
                 <option value="ended">종료</option>
                 <option value="draft">임시저장</option>
               </select>
               <ChevronDown 
                 size={16} 
                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
               />
             </div>
           </div>
        </div>
      </Card>

      {/* 이벤트 목록 */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card 
              key={event.id} 
              isDarkMode={isDarkMode} 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleEventClick(event.id)}
            >
              <div className="p-6">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                      {event.name || event.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {event.organization || ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                {/* 설명 */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* 날짜 정보 */}
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{formatDate(event.start_at || event.startDate)} ~ {formatDate(event.end_at || event.endDate)}</span>
                  </div>
                </div>

                {/* 참가자 정보 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users size={14} />
                    <span>{(event.participants || 0).toLocaleString()}</span>
                    {event.participant_cap && (
                      <span>/ {event.participant_cap.toLocaleString()}</span>
                    )}
                  </div>
                  
                  {event.status === 'active' && (
                    <div className="flex items-center space-x-1 text-sm text-green-600 dark:text-green-400">
                      <Clock size={14} />
                      <span>진행중</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* 이벤트가 없을 때 */
        <Card isDarkMode={isDarkMode} className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            진행 중인 이벤트가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            아직 생성된 이벤트가 없습니다. 새로운 이벤트를 만들어보세요!
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreateEvent}
          >
            <Plus size={16} className="mr-2" />
            첫 이벤트 만들기
          </Button>
        </Card>
      )}

      {/* 통계 정보 */}
      {filteredEvents.length > 0 && (
        <Card isDarkMode={isDarkMode} className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {filteredEvents.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">전체 이벤트</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredEvents.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">진행중</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredEvents.filter(e => e.status === 'upcoming').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">예정</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {filteredEvents.reduce((sum, e) => sum + e.participants, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">총 참가자</div>
            </div>
          </div>
        </Card>
      )}
    </Layout>
  );
};

export default EventList;

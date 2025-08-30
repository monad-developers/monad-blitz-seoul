import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload, CheckCircle, AlertCircle, Settings, User, Wallet, ChevronDown } from 'lucide-react';
import Layout, { GridContainer, GridItem, Card, Button, Input } from './Layout';
import { useEvent } from '../contexts/EventContext';
import { createEvent } from '../services/api';

const EventCreation = () => {
  const navigate = useNavigate();
  const { eventData, updateEventData } = useEvent();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState(eventData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 달의 날짜 생성
  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달의 마지막 날들
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        fullDate: prevDate.toISOString().split('T')[0]
      });
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: day === today.getDate(),
        fullDate: currentDate.toISOString().split('T')[0]
      });
    }

    // 다음 달의 첫 날들
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: nextDate.toISOString().split('T')[0]
      });
    }

    return days;
  };

  const handleInputChange = (field: string, value: any) => {
    const newData = {
      ...formData,
      [field]: value
    };
    setFormData(newData);
    updateEventData(newData);
  };

  const handleDateSelect = (dateString: string, type: 'start' | 'end') => {
    handleInputChange(type === 'start' ? 'start_date' : 'end_date', dateString);
    if (type === 'start') {
      setShowStartCalendar(false);
    } else {
      setShowEndCalendar(false);
    }
  };

  const handleFileUpload = (file: File | null) => {
    if (file && file.type === 'text/csv') {
      handleInputChange('csvFile', file);
    } else {
      alert('CSV 파일만 업로드 가능합니다.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}월 ${day}일 (${weekDay})`;
  };

  const DatePickerCalendar = ({
    show,
    onDateSelect,
    type
  }: {
    show: boolean;
    onDateSelect: (date: string, type: 'start' | 'end') => void;
    type: 'start' | 'end';
  }) => {
    if (!show) return null;

    return (
      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[9999] p-4 w-80">
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map((day, index) => (
            <button
              key={index}
              onClick={() => onDateSelect(day.fullDate, type)}
              className={`p-2 text-sm rounded-lg transition-all hover:bg-purple-500 hover:text-white
                ${!day.isCurrentMonth
                  ? 'text-gray-300 dark:text-gray-600 opacity-50'
                  : 'text-gray-900 dark:text-gray-100'
                }
                ${day.isToday
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 font-semibold'
                  : ''
                }
              `}
            >
              {day.date}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 이벤트 생성 핸들러
  const handleCreateEvent = async () => {
    setError(null);
    setSuccess(false);
    if (!formData.eventName || !formData.startDate || !formData.endDate) {
      setError('이벤트명, 시작일, 종료일을 모두 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const start_at = formData.startDate + 'T' + (formData.startHour || '09') + ':' + (formData.startMinute || '00') + ':00';
      const end_at = formData.endDate + 'T' + (formData.endHour || '18') + ':' + (formData.endMinute || '00') + ':00';
      const token = localStorage.getItem('adminToken') || '';
      const result = await createEvent(token, {
        name: formData.eventName,
        start_at,
        end_at,
        participant_cap: formData.capacity === 'limited' ? formData.customCapacity : undefined,
        csvFile: formData.csvFile || undefined
      });
      setSuccess(true);
      // 생성된 이벤트 ID를 상태로 전달하며 /prize-management로 이동
      setTimeout(() => navigate('/prize-management', { state: { eventId: result.id } }), 1200);
    } catch (e: any) {
      setError(e?.response?.data?.message || '이벤트 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      pageTitle="이벤트 생성 / 관리"
    >
      {/* 페이지 헤더 */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          이벤트 생성 및 관리
        </h1>
        <p className="text-base xl:text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
          경품 응모 이벤트의 기본 정보를 설정하세요.
          참가자 정보와 이벤트 일정을 입력해주시면 됩니다.
        </p>
      </div>

      <GridContainer gap="lg">
        {/* 이벤트 정보 섹션 */}
        <GridItem>
          <Card isDarkMode={isDarkMode}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Settings size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">이벤트 정보</h2>
            </div>

            <div className="space-y-4">
              {/* 이벤트명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  이벤트 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  placeholder="예: 2025년 신년 경품 이벤트"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              {/* 시작 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작 시간 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowStartCalendar(!showStartCalendar)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 flex items-center justify-between text-left"
                    >
                      <span>{formData.startDate ? formatDate(formData.startDate) : '날짜 선택'}</span>
                      <Calendar size={16} className="text-gray-400" />
                    </button>
                    <DatePickerCalendar
                      show={showStartCalendar}
                      onDateSelect={handleDateSelect}
                      type="start"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={formData.startHour}
                        onChange={(e) => handleInputChange('startHour', e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}시
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={formData.startMinute}
                        onChange={(e) => handleInputChange('startMinute', e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                      >
                        {['00', '30'].map(minute => (
                          <option key={minute} value={minute}>
                            {minute}분
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 종료 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료 시간 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowEndCalendar(!showEndCalendar)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 flex items-center justify-between text-left"
                    >
                      <span>{formData.endDate ? formatDate(formData.endDate) : '날짜 선택'}</span>
                      <Calendar size={16} className="text-gray-400" />
                    </button>
                    <DatePickerCalendar
                      show={showEndCalendar}
                      onDateSelect={handleDateSelect}
                      type="end"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <select
                        value={formData.endHour}
                        onChange={(e) => handleInputChange('endHour', e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}시
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={formData.endMinute}
                        onChange={(e) => handleInputChange('endMinute', e.target.value)}
                        className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 appearance-none"
                      >
                        {['00', '30'].map(minute => (
                          <option key={minute} value={minute}>
                            {minute}분
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                이벤트의 시작과 종료 시간을 설정하여 응모 기간을 관리할 수 있습니다.
              </p>
            </div>
          </Card>
        </GridItem>

        {/* 참가자 설정 섹션 */}
        <GridItem>
          <Card isDarkMode={isDarkMode}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">참가자 설정</h2>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                수용 인원
              </label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="capacity"
                    value="unlimited"
                    checked={formData.capacity === 'unlimited'}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className="w-4 h-4 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-900 dark:text-gray-100">무제한</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="capacity"
                    value="limited"
                    checked={formData.capacity === 'limited'}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className="w-4 h-4 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-gray-900 dark:text-gray-100">제한</span>
                </label>
              </div>

              {formData.capacity === 'limited' && (
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={formData.customCapacity}
                    onChange={(e) => handleInputChange('customCapacity', parseInt(e.target.value) || 0)}
                    min="1"
                    className="w-32 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200"
                    placeholder="100"
                  />
                  <span className="text-gray-900 dark:text-gray-100">명</span>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                참가자 수를 제한하여 이벤트의 규모를 조절할 수 있습니다.
              </p>
            </div>
          </Card>
        </GridItem>

        {/* 참가자 정보 업로드 섹션 */}
        <GridItem>
          <Card isDarkMode={isDarkMode}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Wallet size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">참가자 정보</h2>
            </div>

            {/* 파일 업로드 영역 */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer h-48 flex items-center justify-center
                ${dragActive
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                className="hidden"
              />

              <div className="text-center w-full">
                {formData.csvFile ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{formData.csvFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {(formData.csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputChange('csvFile', null);
                      }}
                      className="text-red-500 hover:text-red-600 text-xs font-medium"
                    >
                      파일 제거
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                      <Upload size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        CSV 파일 업로드
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        파일을 드래그하거나 클릭하여 업로드하세요
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start space-x-2">
                <AlertCircle size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mb-1">
                    CSV 파일 형식 안내
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    첫 번째 열에 ETH 지갑 주소를 포함해주세요. 추가 정보(이름, 이메일 등)가 있다면 다음 열에 포함할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </GridItem>
      </GridContainer>

      {/* 액션 버튼 */}
      <div className="mt-12 flex justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/')}
        >
          취소
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleCreateEvent}
          disabled={loading}
        >
          {loading ? '등록 중...' : '이벤트 생성하기'}
        </Button>
        {error && <div className="text-red-500 mt-4">{error}</div>}
        {success && <div className="text-green-600 mt-4">이벤트가 성공적으로 등록되었습니다!</div>}
      </div>
    </Layout>
  );
};

export default EventCreation;
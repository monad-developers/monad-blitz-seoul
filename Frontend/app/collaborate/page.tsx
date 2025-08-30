'use client';

import { useState, useEffect, useRef } from 'react';

interface Room {
  id: string;
  name: string;
  participants: number;
  createdAt: string;
}

export default function CollaboratePage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 날짜가 변경될 때마다 방 목록의 날짜도 업데이트
    const newDate = currentDate.toISOString().split('T')[0];
    setRooms(prevRooms => 
      prevRooms.map(room => ({
        ...room,
        createdAt: newDate
      }))
    );
  }, [currentDate]);

  const formattedDate = currentDate.toISOString().split('T')[0];
  
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: '1',
      name: '신나는 EDM 작곡방',
      participants: 3,
      createdAt: formattedDate
    },
    {
      id: '2',
      name: '재즈 잼섹션',
      participants: 2,
      createdAt: formattedDate
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  return (
    <main className="min-h-screen bg-black">
      {/* 상단 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-[#744CCC]/5 backdrop-blur-3xl" />
      
      <div className="max-w-6xl mx-auto p-8 relative">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">협업하기</h1>
            <p className="text-gray-400">다른 아티스트들과 함께 작업해보세요</p>
            <p className="text-gray-500 mt-2">{currentDate.toLocaleDateString('ko-KR', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#744CCC] hover:bg-[#744CCC]/90 text-white px-6 py-3 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 방 만들기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => window.location.href = `/collaborate/room/${room.id}`}
              className="bg-[#111111] rounded-xl p-6 hover:bg-[#1A1A1A] transition-all cursor-pointer border border-[#744CCC]/10 hover:border-[#744CCC]/30 group"
            >
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[#744CCC] transition-colors">{room.name}</h3>
              <div className="flex items-center justify-between text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#744CCC] animate-pulse" />
                  <span>참여자 {room.participants}명</span>
                </div>
                <span className="text-sm">{room.createdAt}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 새 방 만들기 모달 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#111111] rounded-xl p-8 w-full max-w-md border border-[#744CCC]/20">
              <h2 className="text-2xl font-bold text-white mb-2">새 방 만들기</h2>
              <p className="text-gray-400 mb-6">함께 작업할 공간의 이름을 지어주세요</p>
              <input
                type="text"
                placeholder="방 이름을 입력하세요"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full bg-black/50 text-white px-4 py-3 rounded-xl mb-6 border border-[#744CCC]/20 focus:border-[#744CCC]/40 focus:outline-none transition-colors placeholder-gray-600"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRoomName('');
                  }}
                  className="px-6 py-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    if (newRoomName.trim()) {
                      const newRoom: Room = {
                        id: (rooms.length + 1).toString(),
                        name: newRoomName.trim(),
                        participants: 1,
                        createdAt: new Date().toISOString().split('T')[0]
                      };
                      setRooms([...rooms, newRoom]);
                      setShowCreateModal(false);
                      setNewRoomName('');
                      // TODO: 실제 서버에 방 생성 요청 보내기
                    }
                  }}
                  className="bg-[#744CCC] hover:bg-[#744CCC]/90 text-white px-6 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  disabled={!newRoomName.trim()}
                >
                  만들기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

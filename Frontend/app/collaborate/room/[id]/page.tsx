'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';
import ScreenShare from '@/components/ScreenShare';
import Chat from '@/components/Chat';

interface Participant {
  id: string;
  name: string;
}

interface Track {
  id: string;
  name: string;
  duration: string;
  uploadedBy: string;
  uploadedAt: string;
  audioUrl: string;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  
  const [socket, setSocket] = useState<any>(null);
  const [userName, setUserName] = useState('사용자');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: '참여자 1' }
  ]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'audio/mpeg' || file.type === 'audio/mp3') {
        setAudioFile(file);
      } else {
        alert('MP3 파일만 업로드 가능합니다.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleUpload = () => {
    if (audioFile) {
      // 실제로는 서버에 업로드하고 URL을 받아와야 합니다.
      const audioUrl = URL.createObjectURL(audioFile);
      
      const newTrack: Track = {
        id: Date.now().toString(),
        name: audioFile.name,
        duration: '00:00:00', // 실제로는 오디오 파일의 duration을 계산해야 합니다
        uploadedBy: userName,
        uploadedAt: new Date().toLocaleString(),
        audioUrl
      };

      setTracks(prev => [...prev, newTrack]);
      setShowUploadModal(false);
      setAudioFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // TODO: 실제 서버에 파일 업로드 및 소켓으로 다른 참여자들에게 알림
      socket?.emit('new-track', newTrack);
    }
  };

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      query: { roomId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('participants-update', (updatedParticipants: Participant[]) => {
      setParticipants(updatedParticipants);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* 상단 헤더 */}
      <header className="bg-[#111111] border-b border-[#744CCC]/20 p-4 backdrop-blur-lg bg-opacity-80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a 
              href="/collaborate" 
              className="text-gray-400 hover:text-[#744CCC] transition-colors flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              돌아가기
            </a>
            <div className="h-6 w-px bg-gray-800"></div>
            <h1 className="text-xl font-semibold flex items-center gap-3">
              <span className="text-[#744CCC]">작업실</span>
              <span className="text-gray-400 font-normal">#{roomId}</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {socket && <ScreenShare socket={socket} roomId={roomId} />}
            <div className="flex items-center -space-x-2">
              {participants.map(participant => (
                <div
                  key={participant.id}
                  className="w-10 h-10 rounded-full bg-[#744CCC]/20 border-2 border-[#744CCC] flex items-center justify-center ring-2 ring-black"
                  title={participant.name}
                >
                  <span className="text-sm font-medium">{participant.name[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 작업 공간 */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        {/* 오디오 트랙 영역 */}
        <div className="col-span-9 bg-[#111111] rounded-xl p-6 border border-[#744CCC]/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#744CCC]">오디오 트랙</h2>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-[#744CCC] hover:bg-[#744CCC]/90 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 트랙 추가
            </button>
          </div>
          <div className="space-y-4">
            {tracks.length === 0 ? (
              <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#744CCC]/10 text-center">
                <p className="text-gray-400">아직 업로드된 트랙이 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">새 트랙 추가 버튼을 눌러 첫 번째 트랙을 업로드해보세요</p>
              </div>
            ) : (
              tracks.map((track) => (
                <div key={track.id} className="bg-[#1A1A1A] p-4 rounded-lg border border-[#744CCC]/10 hover:border-[#744CCC]/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[#744CCC] font-medium">{track.name}</span>
                      <span className="text-xs text-gray-500">{track.duration}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{track.uploadedBy}</p>
                        <p className="text-xs text-gray-500">{track.uploadedAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <audio
                          src={track.audioUrl}
                          controls
                          className="h-8 w-48"
                        />
                        <button className="p-2 hover:bg-[#744CCC]/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="h-20 bg-[#0A0A0A] rounded-lg relative border border-[#744CCC]/5">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                      파형이 여기에 표시됩니다
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="col-span-3 h-[calc(100vh-8rem)]">
          <div className="bg-[#111111] rounded-xl p-6 border border-[#744CCC]/10 h-full">
            <h2 className="text-xl font-semibold text-[#744CCC] mb-6">채팅</h2>
            {socket ? (
              <Chat socket={socket} roomId={roomId} userName={userName} />
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  연결 중...
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 트랙 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111111] rounded-xl p-8 w-full max-w-md border border-[#744CCC]/20">
            <h2 className="text-2xl font-bold text-white mb-2">새 트랙 추가</h2>
            <p className="text-gray-400 mb-6">MP3 파일을 업로드하여 새로운 트랙을 추가하세요</p>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".mp3,audio/mpeg"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-xl transition-colors border border-[#744CCC]/20 text-white flex items-center justify-center space-x-2 mb-4"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>MP3 파일 선택</span>
            </button>

            {audioFile && (
              <div className="mb-6 p-3 bg-[#1a1a1a] rounded-lg border border-[#744CCC]/20">
                <p className="text-sm text-gray-400">
                  선택된 파일: {audioFile.name}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setAudioFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-6 py-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={!audioFile}
                className={`px-6 py-2 rounded-xl transition-colors ${
                  audioFile
                    ? 'bg-[#744CCC] hover:bg-[#744CCC]/90 text-white'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                업로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

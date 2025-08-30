'use client';

import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Socket } from 'socket.io-client';

interface ScreenShareProps {
  socket: Socket;
  roomId: string;
}

export default function ScreenShare({ socket, roomId }: ScreenShareProps) {
  const [sharing, setSharing] = useState(false);
  const [streams, setStreams] = useState<{ [key: string]: MediaStream }>({});
  const peerConnections = useRef<{ [key: string]: Peer.Instance }>({});

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setSharing(true);
      socket.emit('start-screen-share', { roomId });

      socket.on('user-joined', (userId: string) => {
        const peer = new Peer({
          initiator: true,
          stream
        });

        peer.on('signal', (signal) => {
          socket.emit('screen-share-signal', {
            to: userId,
            signal
          });
        });

        peerConnections.current[userId] = peer;
      });

      socket.on('screen-share-signal', ({ from, signal }) => {
        const peer = peerConnections.current[from];
        if (peer) {
          peer.signal(signal);
        }
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    Object.values(streams).forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    setStreams({});
    setSharing(false);
    socket.emit('stop-screen-share', { roomId });
  };

  useEffect(() => {
    socket.on('user-started-sharing', ({ userId }) => {
      const peer = new Peer({
        initiator: false
      });

      peer.on('signal', (signal) => {
        socket.emit('screen-share-signal', {
          to: userId,
          signal
        });
      });

      peer.on('stream', (stream) => {
        setStreams(prev => ({
          ...prev,
          [userId]: stream
        }));
      });

      peerConnections.current[userId] = peer;
    });

    socket.on('user-stopped-sharing', ({ userId }) => {
      if (streams[userId]) {
        streams[userId].getTracks().forEach(track => track.stop());
        setStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[userId];
          return newStreams;
        });
      }
    });

    return () => {
      socket.off('user-started-sharing');
      socket.off('user-stopped-sharing');
      socket.off('screen-share-signal');
      socket.off('user-joined');
    };
  }, [socket, roomId]);

  return (
    <div>
      <button
        onClick={sharing ? stopScreenShare : startScreenShare}
        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
          sharing 
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
            : 'bg-[#744CCC]/10 text-[#744CCC] hover:bg-[#744CCC]/20 border border-[#744CCC]/20'
        }`}
      >
        {sharing ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            화면 공유 중지
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            화면 공유 시작
          </>
        )}
      </button>

      {/* 공유된 화면들 표시 */}
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8" style={{ display: Object.keys(streams).length > 0 ? 'flex' : 'none' }}>
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(streams).map(([userId, stream]) => (
              <div key={userId} className="relative group">
                <video
                  autoPlay
                  playsInline
                  ref={video => {
                    if (video && !video.srcObject) {
                      video.srcObject = stream;
                    }
                  }}
                  className="w-full rounded-xl border-2 border-[#744CCC]/20 group-hover:border-[#744CCC]/40 transition-colors"
                />
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#744CCC]/20 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#744CCC] animate-pulse"></div>
                  사용자 {userId}의 화면
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

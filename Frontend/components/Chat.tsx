'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

interface ChatProps {
  socket: Socket;
  roomId: string;
  userName: string;
}

export default function Chat({ socket, roomId, userName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.on('chat-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chat-message');
    };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Omit<Message, 'id' | 'timestamp'> = {
        userId: socket.id,
        userName,
        content: newMessage.trim(),
      };

      socket.emit('send-message', {
        roomId,
        message
      });

      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-[#1A1A1A] rounded-xl overflow-hidden border border-[#744CCC]/10">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-[#744CCC]/20 scrollbar-track-transparent hover:scrollbar-thumb-[#744CCC]/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-12 h-12 mb-2 text-[#744CCC]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">아직 메시지가 없습니다</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.userId === socket.id ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#744CCC]/20 flex items-center justify-center">
                  <span className="text-xs font-medium">{message.userName[0]}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {message.userName}
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-lg max-w-[80%] ${
                  message.userId === socket.id
                    ? 'bg-[#744CCC] text-white'
                    : 'bg-black/30 text-white border border-[#744CCC]/10'
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form onSubmit={sendMessage} className="p-3 bg-black/20">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="w-full bg-black/30 rounded-xl pl-4 pr-24 py-3 border border-[#744CCC]/10 focus:border-[#744CCC]/30 focus:outline-none transition-colors placeholder-gray-600 text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#744CCC]/10 hover:bg-[#744CCC]/20 text-[#744CCC] px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>전송</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-4 4l4-4-4-4" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

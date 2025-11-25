'use client';

import { useState, useEffect } from 'react';

interface CCIPStatusMonitorProps {
  messageId: string;
  monadAddress: string;
}

interface StatusData {
  status: string;
  progress: number;
  estimatedTime: string;
  receivedAt?: string;
}

export function CCIPStatusMonitor({ messageId, monadAddress }: CCIPStatusMonitorProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 초기 상태 조회
    checkStatus();

    // 10초마다 상태 체크
    const interval = setInterval(async () => {
      await checkStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [messageId]);

  async function checkStatus() {
    try {
      const response = await fetch(`/api/ccip/monitor/${messageId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);

      // 완료된 경우 polling 중지
      if (data.status === 'finalized' || data.status === 'used') {
        // 부모 컴포넌트에 알림 (옵션)
      }
    } catch (err) {
      console.error('Status check error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  if (error) {
    return (
      <div className="bg-[#8B2323] border-4 border-t-[#AA3333] border-l-[#AA3333] border-r-[#551111] border-b-[#551111] p-4 mt-4">
        <h4 className="minecraft-font text-white mb-2 minecraft-text-shadow">❌ Error Checking Status</h4>
        <p className="minecraft-font text-sm text-[#FFAAAA]">{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-4 mt-4">
        <p className="minecraft-font text-[#AAAAAA]">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#5B8FC6] border-4 border-t-[#7FAFD6] border-l-[#7FAFD6] border-r-[#2B4F66] border-b-[#2B4F66] p-4 mt-4">
      <h4 className="minecraft-font text-white mb-3 minecraft-text-shadow">CCIP Transfer Status</h4>

      {/* 진행 바 */}
      <div className="w-full bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] h-6 mb-3 p-1">
        <div
          className="bg-[#55FF55] border-2 border-t-[#77FF77] border-l-[#77FF77] border-r-[#33DD33] border-b-[#33DD33] h-full transition-all duration-500 ease-out"
          style={{ width: `${status.progress}%` }}
        />
      </div>

      {/* 상태 정보 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="minecraft-font text-[#E0E0E0]">Status:</span>
          <span className="minecraft-font capitalize text-white minecraft-text-shadow">{status.status}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="minecraft-font text-[#E0E0E0]">Progress:</span>
          <span className="minecraft-font text-white minecraft-text-shadow">{status.progress}%</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="minecraft-font text-[#E0E0E0]">Estimated time:</span>
          <span className="minecraft-font text-white minecraft-text-shadow">{status.estimatedTime}</span>
        </div>

        {status.receivedAt && (
          <div className="flex justify-between text-sm">
            <span className="minecraft-font text-[#E0E0E0]">Received at:</span>
            <span className="minecraft-font text-white minecraft-text-shadow">
              {new Date(status.receivedAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* 완료 메시지 */}
      {status.status === 'received' && (
        <div className="bg-[#2B8B2B] border-4 border-t-[#55AA55] border-l-[#55AA55] border-r-[#1B5B1B] border-b-[#1B5B1B] p-3 mt-3">
          <p className="minecraft-font text-sm text-white minecraft-text-shadow">
            ✅ Attestation received on Monad!
          </p>
          <p className="minecraft-font text-sm text-[#CCCCCC] mt-1">
            You can now mint your NFT with special CCIP traits.
          </p>
        </div>
      )}

      {status.status === 'used' && (
        <div className="bg-[#5B8FC6] border-4 border-t-[#7FAFD6] border-l-[#7FAFD6] border-r-[#2B4F66] border-b-[#2B4F66] p-3 mt-3">
          <p className="minecraft-font text-sm text-white minecraft-text-shadow">
            🎉 Attestation has been used for minting!
          </p>
        </div>
      )}

      {status.status === 'pending' && (
        <div className="bg-[#8B6331] border-4 border-t-[#AA8700] border-l-[#AA8700] border-r-[#554400] border-b-[#554400] p-3 mt-3">
          <p className="minecraft-font text-sm text-white minecraft-text-shadow">
            ⏳ Your attestation is being processed by CCIP...
          </p>
          <p className="minecraft-font text-xs text-[#CCCCCC] mt-1">
            This process typically takes 15-30 minutes. You can close this page and check back later.
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useConnect, useWalletClient } from 'wagmi';
import { getContract, parseAbi } from 'viem';
import { CONTRACT_ADDRESSES, MUSIC_COLLABORATION_HUB_ABI } from '@/config/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { uploadFile } from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function MusicPage() {
  const [fileName, setFileName] = useState('파일을 업로드해주세요');
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  
  const { address } = useAccount();
    const { data: walletClient } = useWalletClient();

  const contract = walletClient ? getContract({
    address: CONTRACT_ADDRESSES.MUSIC_COLLABORATION_HUB as `0x${string}`,
    abi: parseAbi(MUSIC_COLLABORATION_HUB_ABI),
    client: {
      public: walletClient,
      wallet: walletClient
    }
  }) : null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const uploadedFile = event.target.files?.[0];
      if (!uploadedFile) return;
      
      if (!address) {
        toast.error('지갑을 먼저 연결해주세요.');
        return;
      }

      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      
      let loadingToast = toast.loading('파일 업로드 중...');
      
      try {
        // 백엔드 API를 통해 S3에 파일 업로드
        const fileUrl = await uploadFile(uploadedFile);
      
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      // 스마트 컨트랙트에 프로젝트 생성
      const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30일 후
      await contract.write.createProject({
        args: [
          "음악", // 장르
          BigInt(0), // 예산 (필요에 따라 수정)
          BigInt(deadline),
          BigInt(1) // chainSelector (필요에 따라 수정)
        ]
      });
      
      // 작업 페이지로 이동
      localStorage.setItem('uploadedFile', fileUrl);
      router.push(`/music/work?fileName=${encodeURIComponent(uploadedFile.name)}`);
      
      toast.success('파일 업로드 완료!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('업로드 중 오류가 발생했습니다.');
      } finally {
        toast.dismiss(loadingToast);
      }
    } catch (error) {
      console.error('File handling error:', error);
      toast.error('파일 처리 중 오류가 발생했습니다.');
    }
  };

  const handleWork = () => {
    router.push('/music/work');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black">
      <div className="text-center w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ConnectButton />
        </div>
        <h1 className="text-4xl font-bold text-white mb-12">내 음악</h1>
        
        {/* 파일 표시 영역 */}
        <div className="bg-gray-300 rounded-lg p-4 mb-6 text-black text-left">
          <span className="font-medium">{fileName}</span>
        </div>
        
        {/* 버튼 영역 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleWork}
            className="bg-gray-300 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            작업하기
          </button>
          
          <label className="bg-gray-300 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-400 transition-colors cursor-pointer">
            업로드하기
            <input
              type="file"
              accept=".mp3,.wav,.flac"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        
        <div className="mt-8">
          <a 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors text-lg"
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  )
}

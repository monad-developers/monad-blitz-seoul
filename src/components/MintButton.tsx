'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { executeMintPipeline } from '@/lib/mintPipeline';
import { prepareUploadSignature } from '@/lib/signature';
import { WealthTier } from '@/types';
import { MinecraftPFPABI } from '@/lib/contractABI';
import { MinecraftButton } from './minecraft/MinecraftButton';

interface MintButtonProps {
    wealthTier: WealthTier;
    specialItem: number;
    totalWealthUSD: number;
    solValueUSD: number;
    disabled?: boolean;
}

export function MintButton({
    wealthTier,
    specialItem,
    totalWealthUSD,
    solValueUSD,
    disabled,
}: MintButtonProps) {
    const { address, isConnected } = useAccount();
    const [isMinting, setIsMinting] = useState(false);
    const [mintStatus, setMintStatus] = useState<string>('');

    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });
    const { signMessageAsync } = useSignMessage();

    const handleMint = async () => {
        if (!address || !isConnected) {
            alert('지갑을 먼저 연결해주세요');
            return;
        }

        try {
            setIsMinting(true);
            setMintStatus('GIF 생성 중...');

            // 1. GIF 생성 및 메타데이터 준비
            const result = await executeMintPipeline({
                address,
                wealthTier,
                specialItem,
                totalWealthUSD,
                solValueUSD,
                tokenId: 0, // 실제로는 컨트랙트에서 자동 증가
                contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
            });

            setMintStatus('서명 요청 중...');

            // 2. 지갑 서명 생성
            const { message, timestamp } = prepareUploadSignature(address);
            const signature = await signMessageAsync({ message });

            setMintStatus('IPFS 업로드 중...');

            // 3. 서버 API를 통한 IPFS 업로드
            const formData = new FormData();
            formData.append('signature', signature);
            formData.append('message', message);
            formData.append('address', address);
            formData.append('timestamp', timestamp.toString());
            formData.append('gifBlob', result.gifBlob, 'avatar.gif');
            formData.append('metadata', JSON.stringify(result.metadata));

            const uploadResponse = await fetch('/api/upload-gif', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`IPFS 업로드 실패: ${errorData.error || '알 수 없는 오류'}`);
            }

            const { metadataCid } = await uploadResponse.json();
            const metadataUri = `ipfs://${metadataCid}`;

            setMintStatus('트랜잭션 전송 중...');

            // 4. 스마트 컨트랙트 mint 호출
            const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

            if (!contractAddress) {
                throw new Error('컨트랙트 주소가 설정되지 않았습니다');
            }

            writeContract({
                address: contractAddress,
                abi: MinecraftPFPABI,
                functionName: 'mint',
                args: [metadataUri],
            });

            setMintStatus('트랜잭션 대기 중...');
        } catch (error) {
            console.error('민팅 실패:', error);
            setMintStatus('민팅 실패');
            alert(`민팅에 실패했습니다: ${error}`);
            setIsMinting(false);
        }
    };

    if (!isConnected) {
        return <ConnectButton />;
    }

    if (isSuccess) {
        return (
            <div className="bg-[#8B7355] border-4 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#555555] border-b-[#555555] p-6 text-center">
                <p className="minecraft-font text-[#55FF55] text-lg mb-2 minecraft-text-shadow">
                    ✅ 민팅 성공!
                </p>
                <p className="minecraft-font text-white text-xs">
                    TX: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <MinecraftButton
                onClick={handleMint}
                disabled={disabled || isMinting || isConfirming}
                variant="primary"
                size="lg"
                className="w-full"
            >
                {isMinting || isConfirming ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {isConfirming ? 'TX 확인 중...' : '민팅 중...'}
                    </span>
                ) : (
                    'NFT 민팅하기'
                )}
            </MinecraftButton>

            {mintStatus && (
                <p className="minecraft-font text-center text-white text-xs minecraft-text-shadow">
                    {mintStatus}
                </p>
            )}
        </div>
    );
}

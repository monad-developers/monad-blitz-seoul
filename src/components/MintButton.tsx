'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { executeMintPipeline } from '@/lib/mintPipeline';
import { WealthTier } from '@/types';

interface MintButtonProps {
    wealthTier: WealthTier;
    specialItem: number;
    totalWealthUSD: number;
    ethValueUSD: number;
    usdtValueUSD: number;
    usdcValueUSD: number;
    disabled?: boolean;
}

export function MintButton({
    wealthTier,
    specialItem,
    totalWealthUSD,
    ethValueUSD,
    usdtValueUSD,
    usdcValueUSD,
    disabled,
}: MintButtonProps) {
    const { address, isConnected } = useAccount();
    const [isMinting, setIsMinting] = useState(false);
    const [mintStatus, setMintStatus] = useState<string>('');

    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleMint = async () => {
        if (!address || !isConnected) {
            alert('지갑을 먼저 연결해주세요');
            return;
        }

        try {
            setIsMinting(true);
            setMintStatus('민팅 준비 중...');

            // 1. GIF 생성 및 IPFS 업로드
            const result = await executeMintPipeline({
                address,
                wealthTier,
                specialItem,
                totalWealthUSD,
                ethValueUSD,
                usdtValueUSD,
                usdcValueUSD,
                tokenId: 0, // 실제로는 컨트랙트에서 자동 증가
                contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
            });

            setMintStatus('트랜잭션 전송 중...');

            // 2. 스마트 컨트랙트 mint 호출
            const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

            writeContract({
                address: contractAddress,
                abi: [
                    {
                        name: 'mint',
                        type: 'function',
                        stateMutability: 'nonpayable',
                        inputs: [{ name: 'ipfsUri', type: 'string' }],
                        outputs: [{ name: 'tokenId', type: 'uint256' }],
                    },
                ],
                functionName: 'mint',
                args: [result.metadataUri],
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
            <div className="text-center">
                <p className="text-green-600 font-bold mb-2">✅ 민팅 성공!</p>
                <p className="text-sm text-gray-600">
                    트랜잭션: {hash?.slice(0, 10)}...{hash?.slice(-8)}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                onClick={handleMint}
                disabled={disabled || isMinting || isConfirming}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
                {isMinting || isConfirming ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {isConfirming ? '트랜잭션 확인 중...' : '민팅 중...'}
                    </span>
                ) : (
                    'NFT 민팅하기'
                )}
            </button>

            {mintStatus && (
                <p className="text-sm text-center text-gray-600">{mintStatus}</p>
            )}
        </div>
    );
}

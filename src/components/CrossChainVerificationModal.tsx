'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { SepoliaNFTVerification } from '@/../../components/SepoliaNFTVerification';
import { CCIPStatusMonitor } from '@/../../components/CCIPStatusMonitor';

interface CrossChainVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CrossChainVerificationModal({ isOpen, onClose }: CrossChainVerificationModalProps) {
    const [ccipMessageId, setCCIPMessageId] = useState<string>('');
    const { address } = useAccount();

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // 모달 열릴 때 body 스크롤 방지
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* 배경 오버레이 */}
            <div className="absolute inset-0 bg-black/80" />

            {/* 모달 컨텐츠 */}
            <div
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#654321] border-4 border-t-[#8B6331] border-l-[#8B6331] border-r-[#3C2311] border-b-[#3C2311] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="sticky top-0 bg-[#3C3C3C] border-b-2 border-[#1C1C1C] p-4 flex justify-between items-center">
                    <h2 className="minecraft-font text-white text-xl minecraft-text-shadow">
                        🌉 크로스체인 NFT 검증
                    </h2>
                    <button
                        onClick={onClose}
                        className="minecraft-font text-white text-2xl leading-none hover:text-[#FF5555] transition-colors w-8 h-8 flex items-center justify-center"
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>

                {/* 컨텐츠 */}
                <div className="p-6 space-y-4">
                    <p className="minecraft-font text-sm text-[#CCCCCC]">
                        Ethereum Sepolia에서 NFT를 보유하고 계신가요? 특별한{' '}
                        <strong className="text-[#FFD700]">골든 크라운</strong> 트레이트를 받으세요!
                    </p>

                    {/* Sepolia NFT 검증 UI */}
                    <SepoliaNFTVerification onMessageSent={setCCIPMessageId} />

                    {/* CCIP 전송 상태 모니터링 */}
                    {ccipMessageId && address && (
                        <div className="mt-4">
                            <CCIPStatusMonitor
                                messageId={ccipMessageId}
                                monadAddress={address}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

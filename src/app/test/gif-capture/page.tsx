'use client';

import { useState } from 'react';
import { executePreviewPipeline } from '@/lib/mintPipeline';
import { blobToBase64 } from '@/lib/gifGenerator';
import { MinecraftCard } from '@/components/minecraft/MinecraftCard';
import { MinecraftButton } from '@/components/minecraft/MinecraftButton';

/**
 * GIF 캡처 테스트 페이지
 *
 * 목적: GIF 캡처 프로세스를 테스트하고 결과를 확인하기 위한 개발 도구
 */
export default function GIFCaptureTestPage() {
    const [address, setAddress] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [gifPreview, setGifPreview] = useState<string | null>(null);
    const [gifInfo, setGifInfo] = useState<{
        size: string;
        generationTime: string;
    } | null>(null);
    const [gifBlob, setGifBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCapture = async () => {
        try {
            setIsLoading(true);
            setStatus('GIF 캡처 중...');
            setError(null);
            setGifPreview(null);
            setGifInfo(null);
            setGifBlob(null);

            const startTime = Date.now();

            // 클라이언트에서 직접 GIF 생성
            const { gifBlob: generatedGif } = await executePreviewPipeline(address);

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            setGifInfo({
                size: `${(generatedGif.size / 1024).toFixed(2)} KB`,
                generationTime: `${duration}s`,
            });

            // Base64로 변환하여 미리보기 표시
            const base64 = await blobToBase64(generatedGif);
            setGifPreview(base64);
            setGifBlob(generatedGif);

            setStatus(`✅ GIF 캡처 완료! (${generatedGif.size} bytes)`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
            setError(errorMsg);
            setStatus(`❌ 캡처 실패: ${errorMsg}`);
            console.error('GIF 캡처 오류:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!gifBlob) {
            setError('다운로드할 GIF가 없습니다. 먼저 캡처를 실행하세요.');
            return;
        }

        try {
            const url = URL.createObjectURL(gifBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minecraft-pfp-${address.slice(2, 10)}.gif`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus('✅ GIF 다운로드 완료');
        } catch (err) {
            setError(err instanceof Error ? err.message : '다운로드 실패');
            setStatus('❌ 다운로드 실패');
        }
    };

    return (
        <main className="min-h-screen minecraft-bg p-8">
            {/* 배경 패턴 */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 4px)',
                    backgroundSize: '4px 4px',
                }}
            />

            <div className="max-w-2xl mx-auto relative z-10">
                <header className="text-center space-y-2 mb-8">
                    <h1 className="minecraft-font text-5xl text-white minecraft-text-shadow">
                        GIF 캡처 테스트
                    </h1>
                    <p className="minecraft-font text-sm text-[#AAAAAA] minecraft-text-shadow">
                        개발 도구 - GIF 캡처 프로세스 테스트
                    </p>
                </header>

                {/* 주소 입력 */}
                <MinecraftCard title="주소 입력" className="bg-[#8B7355] mb-6">
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="0x로 시작하는 이더리움 주소"
                            className="w-full px-3 py-2 bg-[#3C3C3C] border-2 border-[#1C1C1C] text-white minecraft-font text-sm font-mono"
                        />
                        <p className="minecraft-font text-xs text-[#AAAAAA]">
                            유효한 이더리움 주소를 입력하세요 (0x로 시작하는 42자)
                        </p>
                    </div>
                </MinecraftCard>

                {/* 제어 버튼 */}
                <MinecraftCard title="제어" className="bg-[#8B7355] mb-6">
                    <div className="space-y-3">
                        <MinecraftButton
                            onClick={handleCapture}
                            disabled={isLoading || !address.match(/^0x[a-fA-F0-9]{40}$/)}
                            variant="primary"
                            className="w-full"
                        >
                            {isLoading ? '캡처 중...' : '🎬 GIF 캡처'}
                        </MinecraftButton>

                        <MinecraftButton
                            onClick={handleDownload}
                            disabled={!gifPreview || isLoading}
                            variant="secondary"
                            className="w-full"
                        >
                            📥 GIF 다운로드
                        </MinecraftButton>
                    </div>
                </MinecraftCard>

                {/* 상태 메시지 */}
                {status && (
                    <MinecraftCard
                        title="상태"
                        className={status.includes('✅') ? 'bg-[#2B5F2B]' : 'bg-[#5F2B2B]'}
                    >
                        <p className="minecraft-font text-sm text-white">{status}</p>
                    </MinecraftCard>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <MinecraftCard title="에러" className="bg-[#8B2323] mb-6">
                        <p className="minecraft-font text-sm text-[#FFB3B3]">{error}</p>
                    </MinecraftCard>
                )}

                {/* GIF 정보 */}
                {gifInfo && (
                    <MinecraftCard title="GIF 정보" className="bg-[#3C3C5F] mb-6">
                        <div className="space-y-2 minecraft-font text-sm text-white">
                            <div className="flex justify-between">
                                <span>파일 크기:</span>
                                <span className="text-[#55FF55]">{gifInfo.size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>생성 시간:</span>
                                <span className="text-[#55FF55]">{gifInfo.generationTime}</span>
                            </div>
                        </div>
                    </MinecraftCard>
                )}

                {/* GIF 미리보기 */}
                {gifPreview && (
                    <MinecraftCard title="미리보기" className="bg-[#8B7355]">
                        <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-4 flex items-center justify-center">
                            <img
                                src={gifPreview}
                                alt="생성된 GIF"
                                className="max-w-full max-h-[384px] image-rendering-pixelated"
                            />
                        </div>
                        <p className="mt-4 minecraft-font text-xs text-center text-[#AAAAAA]">
                            주의: GIF는 384x384 해상도로 생성됩니다.
                        </p>
                    </MinecraftCard>
                )}

                {/* 안내 */}
                <MinecraftCard title="설명" className="bg-[#654321] mt-8">
                    <div className="space-y-3 minecraft-font text-xs text-[#CCCCCC]">
                        <p>
                            이 도구는 GIF 캡처 프로세스를 테스트하기 위한 개발 페이지입니다.
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>384x384 해상도로 GIF를 캡처합니다</li>
                            <li>60프레임 애니메이션을 5FPS로 인코딩합니다</li>
                            <li>생성된 GIF를 다운로드할 수 있습니다</li>
                            <li>API: GET /api/test/gif-capture?address=0x...</li>
                        </ul>
                    </div>
                </MinecraftCard>
            </div>
        </main>
    );
}

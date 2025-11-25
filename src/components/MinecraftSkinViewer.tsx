'use client';

import { useEffect, useRef, useState } from 'react';
import { SkinTraits } from '@/lib/traitGenerator';

interface MinecraftSkinViewerProps {
    address: string;
    width?: number;
    height?: number;
    autoRotate?: boolean;
}

/**
 * skinview3d 라이브러리를 사용한 올바른 Minecraft 스킨 렌더링
 */
export function MinecraftSkinViewer({
    address,
    width = 512,
    height = 512,
    autoRotate = true,
}: MinecraftSkinViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cached, setCached] = useState(false);
    const [traits, setTraits] = useState<SkinTraits | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        let cancelled = false;

        const initializeViewer = async () => {
            try {
                setIsGenerating(true);
                setError(null);

                // 새로운 API 호출: GET /api/skin/[address]
                console.log('[Viewer] Fetching skin for address:', address);
                const response = await fetch(`/api/skin/${address}`, {
                    cache: 'no-store', // 브라우저 캐시 비활성화
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch skin');
                }

                const data = await response.json();
                const { imageUrl, traits: skinTraits, cached: isCached, method } = data;

                setTraits(skinTraits);
                setCached(isCached);
                console.log(`[Viewer] Skin loaded (${isCached ? 'cached' : 'generated'}, method: ${method})`);

                if (cancelled) return;

                // 동적으로 skinview3d 로드 (SSR 방지)
                const skinview3d = await import('skinview3d');
                if (cancelled || !canvasRef.current) return;

                // skinview3d 뷰어 초기화
                const viewer = new skinview3d.SkinViewer({
                    canvas: canvasRef.current,
                    width,
                    height,
                    skin: imageUrl, // Blob URL 사용
                });

                // 걸어가는 애니메이션 추가
                viewer.animation = new skinview3d.WalkingAnimation();
                viewer.animation.speed = 0.5; // 걷는 속도 조절

                // 자동 회전 설정
                viewer.autoRotate = autoRotate;
                viewer.autoRotateSpeed = 0.5; // 회전 속도 조절

                // 카메라 설정
                viewer.zoom = 0.7;
                viewer.fov = 70;

                // 컨트롤 설정
                viewer.controls.enableRotate = true;
                viewer.controls.enableZoom = true;
                viewer.controls.enablePan = false;

                viewerRef.current = viewer;
                setIsGenerating(false);
            } catch (err) {
                console.error('[Viewer] Initialization failed:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsGenerating(false);
            }
        };

        initializeViewer();

        // 클린업
        return () => {
            cancelled = true;
            if (viewerRef.current) {
                viewerRef.current.dispose();
                viewerRef.current = null;
            }
        };
    }, [address, width, height, autoRotate]);

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="rounded-lg shadow-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
            />

            {/* 로딩 상태 */}
            {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-white text-center">
                        <div className="mb-2">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                        <div className="text-sm">
                            스킨 로딩 중...
                        </div>
                    </div>
                </div>
            )}

            {/* 에러 메시지 */}
            {error && (
                <div className="absolute top-4 left-4 bg-red-500/90 text-white px-3 py-1 rounded text-sm max-w-xs">
                    {error}
                </div>
            )}

            {/* 하단 라벨 */}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                {cached ? '캐시된 스킨' : '새로 생성된 스킨'}
            </div>
        </div>
    );
}

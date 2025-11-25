/**
 * 개발용 스킨 삭제 API
 *
 * GET /api/dev/delete-skin/[address]
 * 특정 주소의 스킨 정보와 storage 파일을 삭제합니다.
 *
 * ⚠️ 주의: 이 API는 개발용으로만 사용하세요!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSkinByAddress, deleteSkin, deleteSkinImage } from '@/lib/db/client';

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    try {
        const { address } = params;

        // 주소 검증
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json(
                { error: 'Invalid Ethereum address format' },
                { status: 400 }
            );
        }

        console.log('[DEV API] Deleting skin for address:', address);

        // 1. DB에서 스킨 정보 조회 (storage_path 확인용)
        const skin = await getSkinByAddress(address);

        if (!skin) {
            return NextResponse.json(
                {
                    success: false,
                    message: `No skin found for address: ${address}`,
                    deleted: {
                        database: false,
                        storage: false,
                    },
                },
                { status: 404 }
            );
        }

        console.log('[DEV API] Found skin:', {
            address: skin.address,
            storagePath: skin.storage_path,
            imageUrl: skin.image_url,
        });

        // 2. Storage에서 이미지 삭제
        let storageDeleted = false;
        try {
            await deleteSkinImage(skin.storage_path);
            storageDeleted = true;
            console.log('[DEV API] Deleted from storage:', skin.storage_path);
        } catch (storageError) {
            console.error('[DEV API] Failed to delete from storage:', storageError);
            // Storage 삭제 실패는 에러로 처리하지 않고 계속 진행
        }

        // 3. DB에서 스킨 정보 삭제
        await deleteSkin(address);
        console.log('[DEV API] Deleted from database:', address);

        return NextResponse.json({
            success: true,
            message: `Successfully deleted skin for address: ${address}`,
            deleted: {
                database: true,
                storage: storageDeleted,
            },
            deletedData: {
                address: skin.address,
                storagePath: skin.storage_path,
                imageUrl: skin.image_url,
                generationMethod: skin.generation_method,
            },
        });
    } catch (error) {
        console.error('[DEV API] Delete skin failed:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error occurred';

        return NextResponse.json(
            { error: `Failed to delete skin: ${errorMessage}` },
            { status: 500 }
        );
    }
}

/**
 * Next.js 캐싱 비활성화
 * 개발용 API는 항상 최신 상태 반영
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

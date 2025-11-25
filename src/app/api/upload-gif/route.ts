/**
 * IPFS GIF 업로드 API Route
 *
 * 지갑 서명 검증 후 서버에서 안전하게 IPFS 업로드
 */

import { NextRequest, NextResponse } from 'next/server';
import { PinataSDK } from 'pinata-web3';
import { verifyUploadSignature } from '@/lib/signature';
import { UploadSignature, NFTMetadata } from '@/types';
import { createClient } from '@supabase/supabase-js';

// Vercel 함수 타임아웃 30초
export const maxDuration = 30;

// 파일 크기 제한: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 허용된 MIME 타입
const ALLOWED_MIME_TYPES = ['image/gif'];

/**
 * Pinata 클라이언트 생성 (서버 전용)
 */
function createPinataClient(): PinataSDK {
    const jwt = process.env.PINATA_JWT;

    if (!jwt) {
        throw new Error('PINATA_JWT is not configured (server-side only)');
    }

    return new PinataSDK({
        pinataJwt: jwt,
    });
}

/**
 * Supabase 클라이언트 생성 (서버 전용 - Service Role)
 */
function createSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GIF 파일 실제 검증 (Magic Bytes)
 */
function isValidGIF(buffer: ArrayBuffer): boolean {
    const bytes = new Uint8Array(buffer);

    // GIF 파일은 "GIF87a" 또는 "GIF89a"로 시작
    if (bytes.length < 6) return false;

    return (
        bytes[0] === 0x47 && // 'G'
        bytes[1] === 0x49 && // 'I'
        bytes[2] === 0x46 && // 'F'
        bytes[3] === 0x38 && // '8'
        (bytes[4] === 0x37 || bytes[4] === 0x39) && // '7' or '9'
        bytes[5] === 0x61 // 'a'
    );
}

/**
 * 메타데이터 형식 검증
 */
function validateMetadata(metadata: NFTMetadata): { valid: boolean; error?: string } {
    // 필수 필드 검증
    if (!metadata.name || typeof metadata.name !== 'string') {
        return { valid: false, error: 'Missing or invalid "name" field' };
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
        return { valid: false, error: 'Missing or invalid "description" field' };
    }

    if (!metadata.image || typeof metadata.image !== 'string') {
        return { valid: false, error: 'Missing or invalid "image" field' };
    }

    if (!Array.isArray(metadata.attributes)) {
        return { valid: false, error: 'Missing or invalid "attributes" field' };
    }

    // 길이 제한 (XSS 및 스토리지 남용 방지)
    if (metadata.name.length > 200) {
        return { valid: false, error: 'Name too long (max 200 characters)' };
    }

    if (metadata.description.length > 2000) {
        return { valid: false, error: 'Description too long (max 2000 characters)' };
    }

    // XSS 방지: 스크립트 태그 검사
    const xssPattern = /<script|javascript:|onerror=|onload=/i;
    if (xssPattern.test(metadata.name) || xssPattern.test(metadata.description)) {
        return { valid: false, error: 'Invalid characters detected in metadata' };
    }

    return { valid: true };
}

/**
 * POST /api/upload-gif
 *
 * Body (FormData):
 * - signature: 서명 (0x...)
 * - message: 서명된 메시지
 * - address: 사용자 주소 (0x...)
 * - timestamp: 서명 타임스탬프
 * - gifBlob: GIF 파일
 * - metadata: NFT 메타데이터 (JSON string)
 */
export async function POST(request: NextRequest) {
    try {
        // 1. FormData 파싱
        const formData = await request.formData();

        const signature = formData.get('signature') as string;
        const message = formData.get('message') as string;
        const address = formData.get('address') as string;
        const timestampStr = formData.get('timestamp') as string;
        const gifFile = formData.get('gifBlob') as File;
        const metadataStr = formData.get('metadata') as string;

        // 2. 필수 필드 검증
        if (!signature || !message || !address || !timestampStr) {
            return NextResponse.json(
                { error: 'Missing required signature fields' },
                { status: 400 }
            );
        }

        if (!gifFile) {
            return NextResponse.json(
                { error: 'Missing GIF file' },
                { status: 400 }
            );
        }

        if (!metadataStr) {
            return NextResponse.json(
                { error: 'Missing metadata' },
                { status: 400 }
            );
        }

        // 3. 주소 정규화 (소문자)
        const normalizedAddress = address.toLowerCase();

        // 4. 이미 업로드했는지 확인 (주소당 1회만 허용)
        const supabase = createSupabaseClient();

        const { data: existingUpload, error: dbError } = await supabase
            .from('ipfs_uploads')
            .select('gif_cid, created_at')
            .eq('address', normalizedAddress)
            .single();

        if (existingUpload) {
            return NextResponse.json(
                {
                    error: 'Already uploaded. Only one upload per address allowed.',
                    existing: {
                        gifCid: existingUpload.gif_cid,
                        uploadedAt: existingUpload.created_at
                    }
                },
                { status: 409 } // Conflict
            );
        }

        // 5. 서명 검증
        const timestamp = parseInt(timestampStr, 10);

        const signatureData: UploadSignature = {
            message,
            signature: signature as `0x${string}`,
            address: address as `0x${string}`,
            timestamp,
        };

        const { valid, error: verifyError } = await verifyUploadSignature(signatureData);

        if (!valid) {
            return NextResponse.json(
                { error: `Signature verification failed: ${verifyError}` },
                { status: 401 }
            );
        }

        // 6. 파일 타입 검증 (MIME)
        if (!ALLOWED_MIME_TYPES.includes(gifFile.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Only GIF allowed. Received: ${gifFile.type}` },
                { status: 400 }
            );
        }

        // 7. 파일 크기 검증 (5MB)
        if (gifFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: `File too large. Max size: 5MB. Received: ${(gifFile.size / 1024 / 1024).toFixed(2)}MB`,
                },
                { status: 400 }
            );
        }

        // 8. GIF 실제 검증 (Magic Bytes)
        const arrayBuffer = await gifFile.arrayBuffer();
        if (!isValidGIF(arrayBuffer)) {
            return NextResponse.json(
                { error: 'Invalid GIF file format (magic bytes check failed)' },
                { status: 400 }
            );
        }

        // 9. 메타데이터 파싱
        let metadata: NFTMetadata;
        try {
            metadata = JSON.parse(metadataStr);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid metadata JSON' },
                { status: 400 }
            );
        }

        // 10. 메타데이터 형식 검증
        const metadataValidation = validateMetadata(metadata);
        if (!metadataValidation.valid) {
            return NextResponse.json(
                { error: metadataValidation.error },
                { status: 400 }
            );
        }

        // 11. Pinata 클라이언트 생성
        const pinata = createPinataClient();

        // 12. GIF 업로드
        const gifUpload = await pinata.upload.file(gifFile);
        const gifCid = gifUpload.IpfsHash;

        // 13. 메타데이터 업데이트 (GIF CID 포함)
        const updatedMetadata: NFTMetadata = {
            ...metadata,
            animation_url: `ipfs://${gifCid}`,
        };

        // 14. 메타데이터 업로드
        const metadataUpload = await pinata.upload.json(updatedMetadata);
        const metadataCid = metadataUpload.IpfsHash;

        // 15. 업로드 기록 저장 (Supabase)
        const ipAddress = request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown';

        const { error: insertError } = await supabase
            .from('ipfs_uploads')
            .insert({
                address: normalizedAddress,
                gif_cid: gifCid,
                metadata_cid: metadataCid,
                file_size: gifFile.size,
                ip_address: ipAddress,
            });

        if (insertError) {
            console.error('Failed to save upload record:', insertError);
            // 업로드는 성공했으므로 계속 진행 (로그만 남김)
        }

        // 16. 응답
        return NextResponse.json({
            success: true,
            gifCid,
            metadataCid,
            gifUrl: `ipfs://${gifCid}`,
            metadataUrl: `ipfs://${metadataCid}`,
        });
    } catch (error: any) {
        console.error('IPFS 업로드 실패:', error);

        // Pinata API 권한 에러 확인
        if (error?.response?.data?.error?.reason === 'NO_SCOPES_FOUND') {
            return NextResponse.json(
                {
                    error: 'Pinata API 키에 업로드 권한이 없습니다. 서버 설정을 확인하세요.',
                },
                { status: 500 }
            );
        }

        // 프로덕션 환경에서는 상세 에러 숨김
        const isDevelopment = process.env.NODE_ENV === 'development';

        return NextResponse.json(
            {
                error: isDevelopment
                    ? `IPFS upload failed: ${error.message || 'Unknown error'}`
                    : 'Upload failed. Please try again later.',
            },
            { status: 500 }
        );
    }
}

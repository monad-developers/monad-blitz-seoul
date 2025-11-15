/**
 * 스킨 이미지 조회/생성 API Route
 *
 * GET /api/skin/[address]
 * Response: { imageUrl: string, traits: SkinTraits, cached: boolean, method: 'ai' | 'procedural' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTraits } from '@/lib/traitGenerator';
import { generateAISkin } from '@/lib/aiSkinGenerator';
import { getSkinByAddress, saveSkin, logGeneration, uploadSkinImage } from '@/lib/db/client';

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

        console.log('[API /skin] Fetching skin for address:', address);

        // 1. DB에서 조회 (캐시된 스킨 확인)
        const cached = await getSkinByAddress(address);

        console.log(cached)
        if (cached) {
            console.log('[API /skin] Returning cached skin');
            return NextResponse.json({
                imageUrl: cached.image_url,
                traits: cached.traits,
                cached: true,
                method: cached.generation_method,
            });
        }

        // 2. 새로 생성: Traits 생성
        console.log('[API /skin] Generating new skin');
        const traits = generateTraits(address);

        // 3. AI 스킨 생성
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error('[API /skin] ANTHROPIC_API_KEY not configured');

            // 히스토리 기록 (실패)
            await logGeneration({
                address,
                method: 'ai',
                success: false,
                errorMessage: 'API key not configured',
            });

            return NextResponse.json(
                { error: 'API key not configured. Please set ANTHROPIC_API_KEY in environment variables.' },
                { status: 500 }
            );
        }

        let skinDataUrl: string;
        let generationMethod: 'ai' | 'procedural' = 'ai';

        try {
            console.log('[API /skin] Generating AI skin...');
            skinDataUrl = await generateAISkin(traits, apiKey);
            console.log('[API /skin] AI skin generated successfully');
        } catch (aiError) {
            console.error('[API /skin] AI generation failed, falling back to procedural:', aiError);

            // 히스토리 기록 (AI 실패)
            await logGeneration({
                address,
                method: 'ai',
                success: false,
                errorMessage: aiError instanceof Error ? aiError.message : 'Unknown error',
            });

            // Fallback: 프로세듀럴 방식 (기존 코드 활용 가능)
            // 여기서는 에러를 반환하지만, 필요시 createSkinTexture() 사용 가능
            return NextResponse.json(
                { error: 'AI generation failed. Please try again.' },
                { status: 500 }
            );
        }

        // 4. Supabase Storage에 저장
        console.log('[API /skin] Uploading to Supabase Storage...');
        const base64Data = skinDataUrl.split(',')[1];
        if (!base64Data) {
            throw new Error('Invalid skin data URL format');
        }

        const buffer = Buffer.from(base64Data, 'base64');

        const { publicUrl, path } = await uploadSkinImage(address, buffer);

        console.log('[API /skin] Uploaded to Storage:', publicUrl);

        // 5. DB에 저장
        await saveSkin({
            address,
            traits,
            imageUrl: publicUrl,
            storagePath: path,
            method: generationMethod,
        });

        // 6. 히스토리 기록 (성공)
        await logGeneration({
            address,
            method: generationMethod,
            success: true,
        });

        console.log('[API /skin] Skin saved to database');

        return NextResponse.json({
            imageUrl: publicUrl,
            traits,
            cached: false,
            method: generationMethod,
        });
    } catch (error) {
        console.error('[API /skin] Skin generation failed:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error occurred';

        return NextResponse.json(
            { error: `Skin generation failed: ${errorMessage}` },
            { status: 500 }
        );
    }
}

/**
 * Vercel 함수 타임아웃 설정
 * AI 생성 + Blob 업로드를 고려하여 30초로 설정
 */
export const maxDuration = 30;

/**
 * Next.js 캐싱 비활성화
 * DB/Storage 상태를 실시간으로 반영하기 위해 필요
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

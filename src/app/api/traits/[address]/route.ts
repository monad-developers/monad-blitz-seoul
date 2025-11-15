/**
 * Traits 조회 API Route
 *
 * GET /api/traits/[address]
 * Response: { traits: SkinTraits, cached: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTraits } from '@/lib/traitGenerator';
import { getSkinByAddress } from '@/lib/db/client';

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

        console.log('[API /traits] Fetching traits for address:', address);

        // DB에서 조회 (캐시된 데이터 확인)
        const cached = await getSkinByAddress(address);

        if (cached) {
            console.log('[API /traits] Returning cached traits');
            return NextResponse.json({
                traits: cached.traits,
                cached: true,
            });
        }

        // 새로 생성 (서버에서 deterministic하게 생성)
        console.log('[API /traits] Generating new traits');
        const traits = generateTraits(address);

        return NextResponse.json({
            traits,
            cached: false,
        });
    } catch (error) {
        console.error('[API /traits] Failed to fetch traits:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error occurred';

        return NextResponse.json(
            { error: `Traits fetch failed: ${errorMessage}` },
            { status: 500 }
        );
    }
}

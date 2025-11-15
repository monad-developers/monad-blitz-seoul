import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * CCIP 메시지 기록 API
 * POST /api/ccip/record-message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      monadAddress,
      sepoliaNFTAddress,
      sepoliaTokenId,
      ccipMessageId,
      attestationId,
      sepoliaTxHash
    } = body;

    // 필수 필드 검증
    if (!monadAddress || !sepoliaNFTAddress || !ccipMessageId || !attestationId) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['monadAddress', 'sepoliaNFTAddress', 'ccipMessageId', 'attestationId']
      }, { status: 400 });
    }

    // Supabase에 CCIP attestation 기록
    const { data, error } = await supabase
      .from('ccip_attestations')
      .insert({
        monad_address: monadAddress.toLowerCase(),
        sepolia_nft_address: sepoliaNFTAddress.toLowerCase(),
        sepolia_token_id: sepoliaTokenId ? sepoliaTokenId.toString() : null,
        ccip_message_id: ccipMessageId,
        attestation_id: attestationId,
        sepolia_tx_hash: sepoliaTxHash || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후 만료
        used: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json({
        error: 'Failed to record message in database',
        details: error.message
      }, { status: 500 });
    }

    console.log('CCIP message recorded successfully:', data);

    return NextResponse.json({
      success: true,
      record: data
    });
  } catch (error) {
    console.error('Record message error:', error);
    return NextResponse.json({
      error: 'Failed to record message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

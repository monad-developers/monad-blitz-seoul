import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

/**
 * CCIP 메시지 모니터링 API
 * GET /api/ccip/monitor/[messageId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
  }

  try {
    // Supabase에서 CCIP attestation 조회
    const { data: attestation, error } = await supabase
      .from('ccip_attestations')
      .select('*')
      .eq('ccip_message_id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Message not found',
          messageId
        }, { status: 404 });
      }

      console.error('Database query error:', error);
      return NextResponse.json({
        error: 'Failed to query database',
        details: error.message
      }, { status: 500 });
    }

    // 상태에 따른 진행률 계산
    let progress = 0;
    let estimatedTime = '15-30 minutes';

    switch (attestation.status) {
      case 'pending':
        progress = 25;
        estimatedTime = '15-30 minutes';
        break;
      case 'sent':
        progress = 50;
        estimatedTime = '10-20 minutes';
        break;
      case 'confirmed':
        progress = 75;
        estimatedTime = '5-10 minutes';
        break;
      case 'completed':
        progress = 100;
        estimatedTime = 'Completed';
        break;
      case 'failed':
        progress = 0;
        estimatedTime = 'Failed';
        break;
      default:
        progress = 0;
        estimatedTime = 'Unknown';
    }

    return NextResponse.json({
      messageId,
      status: attestation.status,
      progress,
      estimatedTime,
      monadAddress: attestation.monad_address,
      sepoliaNFTAddress: attestation.sepolia_nft_address,
      sepoliaTokenId: attestation.sepolia_token_id,
      attestationId: attestation.attestation_id,
      createdAt: attestation.created_at,
      expiresAt: attestation.expires_at,
      used: attestation.used,
      monadTxHash: attestation.monad_tx_hash || null
    });
  } catch (error) {
    console.error('Monitor error:', error);
    return NextResponse.json({
      error: 'Failed to monitor message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

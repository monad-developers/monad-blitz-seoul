import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from '@/lib/chains';

/**
 * Attestation 상태 확인 API
 * GET /api/ccip/attestation-status/[address]
 *
 * Monad 컨트랙트에서 사용자의 유효한 attestation 여부 확인
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const MONAD_CCIP_RECEIVER = process.env.NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS as `0x${string}`;

    if (!MONAD_CCIP_RECEIVER) {
      return NextResponse.json({
        error: 'CCIP Receiver contract not configured',
        hasAttestation: false
      }, { status: 500 });
    }

    // Monad 네트워크 Public Client 생성
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http()
    });

    // MonadCCIPReceiver 컨트랙트의 hasValidAttestation 호출
    const hasAttestation = await client.readContract({
      address: MONAD_CCIP_RECEIVER,
      abi: [
        {
          name: 'hasValidAttestation',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'user', type: 'address' }],
          outputs: [{ name: 'valid', type: 'bool' }]
        }
      ],
      functionName: 'hasValidAttestation',
      args: [address as `0x${string}`]
    });

    return NextResponse.json({
      hasAttestation,
      address,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Attestation check error:', error);

    // 컨트랙트 호출 실패 시 false 반환 (배포 전이거나 네트워크 문제)
    return NextResponse.json({
      hasAttestation: false,
      address,
      error: 'Failed to check attestation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

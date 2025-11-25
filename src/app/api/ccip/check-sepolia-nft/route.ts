import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Sepolia NFT 소유권 확인 API
 * GET /api/ccip/check-sepolia-nft?address=0x...
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  // 환경 변수에서 MonadPenguins 컨트랙트 주소 가져오기
  const nftContract = process.env.NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT;

  if (!nftContract) {
    return NextResponse.json({ error: 'Sepolia NFT contract address not configured' }, { status: 500 });
  }

  try {
    // Sepolia Public RPC 클라이언트 생성
    const client = createPublicClient({
      chain: sepolia,
      transport: http()
    });

    // MonadPenguins 컨트랙트 ABI
    const monadPenguinsABI = [
      {
        name: 'tokensOfOwner',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'tokenIds', type: 'uint256[]' }]
      }
    ] as const;

    // tokensOfOwner 호출로 사용자가 소유한 모든 토큰 ID 조회
    const tokenIdsBigInt = await client.readContract({
      address: nftContract as `0x${string}`,
      abi: monadPenguinsABI,
      functionName: 'tokensOfOwner',
      args: [address as `0x${string}`]
    });

    const tokenIds = (tokenIdsBigInt as bigint[]).map(id => Number(id));
    const hasNFT = tokenIds.length > 0;
    const balanceNumber = tokenIds.length;

    return NextResponse.json({
      hasNFT,
      balance: balanceNumber.toString(),
      tokenIds
    });
  } catch (error) {
    console.error('NFT check error:', error);
    return NextResponse.json({
      error: 'Failed to check NFT ownership',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

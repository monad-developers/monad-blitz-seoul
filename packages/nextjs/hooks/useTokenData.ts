import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { useDeployedContractInfo } from '~~/hooks/scaffold-eth';

interface TokenData {
  tokenId: number;
  owner: string;
  metadataUri: string;
  mintedAt: number;
  tokenType: number;
}

export const useTokenData = (tokenId: number | null) => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();
  const { data: contractInfo } = useDeployedContractInfo("ProfileNFT1155");

  useEffect(() => {
    const fetchTokenData = async () => {
      if (!tokenId || !publicClient || !contractInfo) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(`🔍 토큰 ID ${tokenId} 데이터 조회 중...`);
        
        // getTokenInfo 함수 호출
        const result = await publicClient.readContract({
          address: contractInfo.address as `0x${string}`,
          abi: contractInfo.abi,
          functionName: 'getTokenInfo',
          args: [BigInt(tokenId)],
        });

        if (Array.isArray(result) && result.length >= 5) {
          const tokenData: TokenData = {
            tokenId: Number(result[0]),
            owner: result[1] as string,
            metadataUri: result[2] as string,
            mintedAt: Number(result[3]),
            tokenType: Number(result[4])
          };
          
          setTokenData(tokenData);
          console.log(`✅ 토큰 ID ${tokenId} 데이터 로드 완료:`, tokenData);
        }
      } catch (err) {
        console.error(`❌ 토큰 ID ${tokenId} 데이터 로드 실패:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenId, publicClient, contractInfo]);

  return { tokenData, isLoading, error };
};
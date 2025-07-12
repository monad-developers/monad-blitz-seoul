import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { useDeployedContractInfo, useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { findFirstImageUrl } from '~~/utils/imageUtils';
import { fetchMetadata, extractAISummary } from '~~/utils/metadataUtils';

interface MintedProfile {
  tokenId: number;
  owner: string;
  metadataUri: string;
  mintedAt: number;
  tokenType: number;
  profile?: {
    name: string;
    role: string;
    introduction: string;
    skills: string;
    contact: string;
    portfolioLink: string;
    fileUrls: string[];
    profileImageUrl?: string | null;
    aiSummary?: string | null;
  };
}

export const useMintedProfiles = () => {
  const [mintedProfiles, setMintedProfiles] = useState<MintedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const publicClient = usePublicClient();
  const { data: contractInfo } = useDeployedContractInfo("ProfileNFT1155");
  
  // 총 민팅된 토큰 수 조회
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "ProfileNFT1155",
    functionName: "totalMintedTokens",
  });

  useEffect(() => {
    const fetchMintedProfiles = async () => {
      if (!totalSupply || totalSupply === 0n || !publicClient || !contractInfo) {
        setMintedProfiles([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`📊 ${totalSupply}개의 민팅된 NFT 프로필 데이터 로드 중...`);
        
        const profiles: MintedProfile[] = [];
        
        // 모든 토큰에 대해 정보 조회
        for (let tokenId = 1; tokenId <= Number(totalSupply); tokenId++) {
          try {
            // 토큰 정보 조회
            const tokenResult = await publicClient.readContract({
              address: contractInfo.address as `0x${string}`,
              abi: contractInfo.abi,
              functionName: 'getTokenInfo',
              args: [BigInt(tokenId)],
            });

            if (Array.isArray(tokenResult) && tokenResult.length >= 5) {
              const mintedProfile: MintedProfile = {
                tokenId: Number(tokenResult[0]),
                owner: tokenResult[1] as string,
                metadataUri: tokenResult[2] as string,
                mintedAt: Number(tokenResult[3]),
                tokenType: Number(tokenResult[4])
              };

              // 토큰 소유자의 프로필 정보도 조회
              try {
                const profileResult = await publicClient.readContract({
                  address: contractInfo.address as `0x${string}`,
                  abi: contractInfo.abi,
                  functionName: 'getProfileByWallet',
                  args: [mintedProfile.owner as `0x${string}`],
                });

                if (Array.isArray(profileResult) && profileResult.length >= 10) {
                  const fileUrls = profileResult[7] as string[];
                  
                  // 파일 URL 배열에서 첫 번째 이미지 찾기
                  const profileImageUrl = findFirstImageUrl(fileUrls);
                  
                  console.log(`📁 토큰 ID ${tokenId} 파일 URLs:`, fileUrls);
                  console.log(`🖼️ 토큰 ID ${tokenId} 추출된 이미지 URL:`, profileImageUrl);
                  
                  // 메타데이터에서 AI 요약 가져오기
                  let aiSummary: string | null = null;
                  try {
                    console.log(`🤖 토큰 ID ${tokenId} AI 요약 조회 중... URI: ${mintedProfile.metadataUri}`);
                    const metadata = await fetchMetadata(mintedProfile.metadataUri);
                    aiSummary = extractAISummary(metadata);
                    console.log(`🤖 토큰 ID ${tokenId} AI 요약:`, aiSummary ? `${aiSummary.substring(0, 50)}...` : '없음');
                  } catch (metadataError) {
                    console.warn(`⚠️ 토큰 ID ${tokenId} 메타데이터 조회 실패:`, metadataError);
                  }
                  
                  mintedProfile.profile = {
                    name: profileResult[1] as string,
                    role: profileResult[2] as string,
                    introduction: profileResult[3] as string,
                    skills: profileResult[4] as string,
                    contact: profileResult[5] as string,
                    portfolioLink: profileResult[6] as string,
                    fileUrls: fileUrls,
                    profileImageUrl: profileImageUrl,
                    aiSummary: aiSummary
                  };
                }
              } catch (profileError) {
                console.warn(`⚠️ 토큰 ID ${tokenId}의 프로필 정보 조회 실패:`, profileError);
              }

              profiles.push(mintedProfile);
              console.log(`✅ 토큰 ID ${tokenId} 로드 완료`);
            }
          } catch (tokenError) {
            console.warn(`⚠️ 토큰 ID ${tokenId} 조회 실패:`, tokenError);
          }
        }
        
        setMintedProfiles(profiles);
        console.log(`🎉 총 ${profiles.length}개의 민팅된 프로필 로드 완료`);
        
      } catch (err) {
        console.error('❌ 민팅된 프로필 로드 실패:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMintedProfiles();
  }, [totalSupply, publicClient, contractInfo]);

  return { mintedProfiles, isLoading, error, totalSupply };
};
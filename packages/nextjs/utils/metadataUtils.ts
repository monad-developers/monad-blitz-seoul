/**
 * NFT 메타데이터 파싱 유틸리티
 */

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  properties?: {
    role?: string;
    bio?: string;
    skills?: string[];
    contact?: string;
    portfolioLink?: string;
    profileImageUrl?: string;
    resumeFileUrl?: string;
    aiSummary?: string;
    createdAt?: string;
    creator?: string;
  };
}

/**
 * 메타데이터 URI에서 실제 메타데이터를 가져오는 함수
 */
export const fetchMetadata = async (metadataUri: string): Promise<NFTMetadata | null> => {
  if (!metadataUri) return null;
  
  try {
    console.log(`📄 메타데이터 가져오는 중: ${metadataUri}`);
    
    // Base64 인코딩된 데이터 URL인 경우
    if (metadataUri.startsWith('data:application/json;base64,')) {
      const base64Data = metadataUri.split(',')[1];
      const jsonString = atob(base64Data);
      const metadata = JSON.parse(jsonString);
      console.log(`✅ Base64 메타데이터 파싱 완료:`, metadata);
      return metadata;
    }
    
    // IPFS 또는 HTTP URL인 경우
    if (metadataUri.startsWith('http') || metadataUri.startsWith('ipfs://')) {
      let fetchUrl = metadataUri;
      
      // IPFS URL을 HTTP 게이트웨이 URL로 변환
      if (metadataUri.startsWith('ipfs://')) {
        fetchUrl = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const metadata = await response.json();
      console.log(`✅ 메타데이터 가져오기 완료:`, metadata);
      return metadata;
    }
    
    console.warn(`⚠️ 지원되지 않는 메타데이터 URI 형식: ${metadataUri}`);
    return null;
    
  } catch (error) {
    console.error(`❌ 메타데이터 가져오기 실패 (${metadataUri}):`, error);
    return null;
  }
};

/**
 * 메타데이터에서 AI 요약을 추출하는 함수
 */
export const extractAISummary = (metadata: NFTMetadata | null): string | null => {
  if (!metadata) return null;
  
  // properties.aiSummary에서 먼저 확인
  if (metadata.properties?.aiSummary) {
    return metadata.properties.aiSummary;
  }
  
  // description을 fallback으로 사용 (bio가 없고 aiSummary가 description에 있는 경우)
  if (metadata.description && !metadata.properties?.bio) {
    return metadata.description;
  }
  
  return null;
};

/**
 * 메타데이터에서 모든 유용한 정보를 추출하는 함수
 */
export const extractMetadataInfo = (metadata: NFTMetadata | null) => {
  if (!metadata) return null;
  
  return {
    name: metadata.name,
    description: metadata.description,
    image: metadata.image,
    aiSummary: extractAISummary(metadata),
    bio: metadata.properties?.bio,
    role: metadata.properties?.role,
    skills: metadata.properties?.skills,
    contact: metadata.properties?.contact,
    portfolioLink: metadata.properties?.portfolioLink,
    profileImageUrl: metadata.properties?.profileImageUrl,
    resumeFileUrl: metadata.properties?.resumeFileUrl,
    createdAt: metadata.properties?.createdAt,
    creator: metadata.properties?.creator
  };
};
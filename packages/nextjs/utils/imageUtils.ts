/**
 * 이미지 URL인지 확인하는 유틸리티 함수
 */
export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // 일반적인 이미지 확장자
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const lowerUrl = url.toLowerCase();
  
  // 확장자로 확인
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
  
  // MIME 타입으로 확인
  const hasImageMimeType = lowerUrl.includes('image/');
  
  // IPFS 이미지 URL 패턴
  const isIpfsImage = lowerUrl.includes('ipfs') && (hasImageExtension || hasImageMimeType);
  
  // Base64 이미지 데이터
  const isBase64Image = lowerUrl.startsWith('data:image/');
  
  return hasImageExtension || hasImageMimeType || isIpfsImage || isBase64Image;
};

/**
 * 파일 URL 배열에서 첫 번째 이미지 URL을 찾는 함수
 */
export const findFirstImageUrl = (fileUrls: string[]): string | null => {
  if (!fileUrls || fileUrls.length === 0) return null;
  
  for (const url of fileUrls) {
    if (isImageUrl(url)) {
      return url;
    }
  }
  
  return null;
};

/**
 * 이미지 URL이 유효한지 확인하는 함수
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  if (!url || !isImageUrl(url)) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
};
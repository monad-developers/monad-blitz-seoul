// 게이트웨이와 통신하는 API 모듈
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 검색 요청 API
export const searchAPI = async (query: string, userAddress?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        userAddress,
        platform: 'trendlink-widget',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search API failed:', error);
    throw error;
  }
};

// 트렌드 데이터 가져오기 API
export const getTrendingData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trending`);
    
    if (!response.ok) {
      throw new Error(`Trending API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Trending API failed:', error);
    throw error;
  }
};

// 사용자 보상 정보 가져오기 API
export const getUserRewards = async (userAddress: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rewards/${userAddress}`);
    
    if (!response.ok) {
      throw new Error(`Rewards API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Rewards API failed:', error);
    throw error;
  }
};

// 플랫폼 등록 API
export const registerPlatform = async (platformData: {
  name: string;
  description: string;
  walletAddress: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/platform/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(platformData),
    });

    if (!response.ok) {
      throw new Error(`Platform registration error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Platform registration failed:', error);
    throw error;
  }
};

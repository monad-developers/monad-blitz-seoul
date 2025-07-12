const BACKEND_URL = 'https://monad.newjeans.cloud';

export interface WalletAddress {
  id: number;
  address: string;
  created_at: string;
}

export interface WalletResponse {
  wallets: WalletAddress[];
  count: number;
}

export interface AddWalletResponse {
  id: number;
  address: string;
  message: string;
}

/**
 * 지갑 주소를 백엔드에 추가
 */
export async function addWalletAddress(address: string): Promise<AddWalletResponse> {
  try {
    console.log(`🔄 지갑 주소 추가 중: ${address}`);
    
    const response = await fetch(`${BACKEND_URL}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ 지갑 주소 추가 성공:`, data);
    return data;
  } catch (error) {
    console.error('❌ 지갑 주소 추가 실패:', error);
    throw error;
  }
}

/**
 * 모든 지갑 주소 조회
 */
export async function getAllWalletAddresses(): Promise<WalletResponse> {
  try {
    console.log('🔄 모든 지갑 주소 조회 중...');
    
    const response = await fetch(`${BACKEND_URL}/wallets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ 지갑 주소 조회 성공: ${data.count}개 주소`);
    return data;
  } catch (error) {
    console.error('❌ 지갑 주소 조회 실패:', error);
    throw error;
  }
}

/**
 * 지갑 주소 목록에서 주소만 추출
 */
export function extractAddresses(walletResponse: WalletResponse): string[] {
  return walletResponse.wallets.map(wallet => wallet.address);
}

/**
 * 지갑 주소 유효성 검증
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
} 
/**
 * 서명 유틸리티
 *
 * IPFS 업로드 시 지갑 서명 생성 및 검증
 */

import { verifyMessage } from 'viem';
import { UploadSignature } from '../types';

/**
 * 업로드 메시지 형식 생성
 *
 * @param address 사용자 주소
 * @param timestamp 타임스탬프 (밀리초)
 * @returns 서명할 메시지
 */
export function createUploadMessage(address: string, timestamp: number): string {
    return `Upload to IPFS: ${address} at ${timestamp}`;
}

/**
 * 서명 검증
 *
 * @param signature 서명 데이터
 * @returns 검증 성공 여부
 */
export async function verifyUploadSignature(
    signature: UploadSignature
): Promise<{ valid: boolean; error?: string }> {
    const { message, signature: sig, address, timestamp } = signature;

    // 1. 타임스탬프 검증 (5분 이내)
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (now - timestamp > FIVE_MINUTES) {
        return { valid: false, error: 'Signature expired (max 5 minutes)' };
    }

    if (timestamp > now) {
        return { valid: false, error: 'Invalid timestamp (future)' };
    }

    // 2. 메시지 형식 검증
    const expectedMessage = createUploadMessage(address, timestamp);
    if (message !== expectedMessage) {
        return { valid: false, error: 'Invalid message format' };
    }

    // 3. 서명 검증
    try {
        const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: sig,
        });

        if (!isValid) {
            return { valid: false, error: 'Invalid signature' };
        }

        return { valid: true };
    } catch (error: any) {
        console.error('서명 검증 실패:', error);
        return { valid: false, error: `Verification failed: ${error.message}` };
    }
}

/**
 * 클라이언트용: 서명 생성 헬퍼
 * (useSignMessage 훅과 함께 사용)
 *
 * @param address 사용자 주소
 * @returns 서명할 메시지와 타임스탬프
 */
export function prepareUploadSignature(address: string): {
    message: string;
    timestamp: number;
} {
    const timestamp = Date.now();
    const message = createUploadMessage(address, timestamp);

    return { message, timestamp };
}

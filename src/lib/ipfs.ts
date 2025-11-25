/**
 * IPFS Upload Utility
 *
 * Pinata를 사용한 IPFS 업로드
 */

import { PinataSDK } from 'pinata-web3';
import { NFTMetadata } from '../types';

/**
 * Pinata SDK 인스턴스 생성
 */
export function createPinataClient(): PinataSDK {
    const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

    if (!jwt) {
        throw new Error('PINATA_JWT가 설정되지 않았습니다');
    }

    return new PinataSDK({
        pinataJwt: jwt,
    });
}

/**
 * GIF 파일을 IPFS에 업로드
 *
 * @param gifBlob GIF Blob
 * @param filename 파일명
 * @returns IPFS CID
 */
export async function uploadGIFToIPFS(
    gifBlob: Blob,
    filename: string = 'avatar.gif'
): Promise<string> {
    try {
        const pinata = createPinataClient();

        const file = new File([gifBlob], filename, { type: 'image/gif' });
        const upload = await pinata.upload.file(file);

        return upload.IpfsHash;
    } catch (error: any) {
        console.error('GIF IPFS 업로드 실패:', error);

        // Pinata API 권한 에러 확인
        if (error?.response?.data?.error?.reason === 'NO_SCOPES_FOUND') {
            throw new Error(
                'Pinata API 키에 파일 업로드 권한이 없습니다. ' +
                'Pinata 대시보드에서 pinFileToIPFS 권한이 있는 새 API 키를 생성하세요.'
            );
        }

        throw new Error(`GIF IPFS 업로드 실패: ${error.message || '알 수 없는 오류'}`);
    }
}

/**
 * 메타데이터 JSON을 IPFS에 업로드
 *
 * @param metadata NFT 메타데이터
 * @returns IPFS CID
 */
export async function uploadMetadataToIPFS(
    metadata: NFTMetadata
): Promise<string> {
    try {
        const pinata = createPinataClient();

        const upload = await pinata.upload.json(metadata);

        return upload.IpfsHash;
    } catch (error: any) {
        console.error('메타데이터 IPFS 업로드 실패:', error);

        // Pinata API 권한 에러 확인
        if (error?.response?.data?.error?.reason === 'NO_SCOPES_FOUND') {
            throw new Error(
                'Pinata API 키에 JSON 업로드 권한이 없습니다. ' +
                'Pinata 대시보드에서 pinJSONToIPFS 권한이 있는 새 API 키를 생성하세요.'
            );
        }

        throw new Error(`메타데이터 IPFS 업로드 실패: ${error.message || '알 수 없는 오류'}`);
    }
}

/**
 * IPFS에서 데이터 조회
 *
 * @param cid IPFS CID
 * @returns 데이터 URL
 */
export function getIPFSUrl(cid: string): string {
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    return `${gateway}/ipfs/${cid}`;
}

/**
 * IPFS URI 생성
 *
 * @param cid IPFS CID
 * @returns ipfs:// URI
 */
export function getIPFSUri(cid: string): string {
    return `ipfs://${cid}`;
}

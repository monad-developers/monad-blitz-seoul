/**
 * Mint Pipeline
 *
 * 전체 NFT 민팅 프로세스 통합
 */

import { SkinTraits, generateTraits } from './traitGenerator';
import { createSkinTexture, createMinecraftScene, captureAnimationFrames, disposeScene } from './skinRenderer';
import { generateGIF } from './gifGenerator';
import { uploadGIFToIPFS, uploadMetadataToIPFS, getIPFSUri } from './ipfs';
import { generateMetadata } from '../utils/metadata';
import { WealthTier } from '../types';

export interface MintPipelineOptions {
    address: string;
    wealthTier: WealthTier;
    specialItem: number;
    totalWealthUSD: number;
    solValueUSD: number;
    tokenId: number;
    contractAddress: string;
    hasCCIPAttestation?: boolean; // CCIP 크로스체인 검증 플래그
}

export interface MintPipelineResult {
    traits: SkinTraits;
    gifCID: string;
    metadataCID: string;
    metadataUri: string;
}

/**
 * 전체 민팅 파이프라인 실행
 *
 * 1. 스킨 데이터 가져오기 (DB 또는 생성)
 * 2. 3D 모델 렌더링
 * 3. 애니메이션 프레임 캡처
 * 4. GIF 생성
 * 5. IPFS 업로드 (GIF)
 * 6. 메타데이터 생성
 * 7. IPFS 업로드 (메타데이터)
 */
export async function executeMintPipeline(
    options: MintPipelineOptions
): Promise<MintPipelineResult> {
    try {
        console.log('🎨 1. 스킨 데이터 가져오기 중...');

        // DB에서 저장된 스킨 데이터 가져오기 (API 호출)
        let traits: SkinTraits;
        let skinImageUrl: string | null = null;

        try {
            const response = await fetch(`/api/skin/${options.address}`);
            if (response.ok) {
                const data = await response.json();
                traits = data.traits;
                skinImageUrl = data.imageUrl;
                console.log('✅ DB에서 스킨 데이터 가져옴:', data.cached ? '캐시됨' : '새로 생성됨');
            } else {
                console.warn('⚠️ API 호출 실패, 로컬에서 생성');
                traits = generateTraits(options.address);
            }
        } catch (fetchError) {
            console.warn('⚠️ API 호출 에러, 로컬에서 생성:', fetchError);
            traits = generateTraits(options.address);
        }

        console.log('🖼️ 2. 스킨 텍스처 준비 중...');
        let textureCanvas: HTMLCanvasElement;

        if (skinImageUrl) {
            // DB에 저장된 이미지 사용 (AI 생성 또는 기존 스킨)
            console.log('📥 DB 이미지 로드 중:', skinImageUrl);
            textureCanvas = await loadImageToCanvas(skinImageUrl);
        } else {
            // 로컬에서 텍스처 생성 (폴백)
            console.log('🎨 로컬에서 텍스처 생성 중...');
            textureCanvas = createSkinTexture(traits);
        }

        console.log('🎬 3. 3D 씬 설정 중...');
        const renderCanvas = document.createElement('canvas');
        const GIF_SIZE = 384; // Preview와 동일한 크기
        const viewer = await createMinecraftScene(renderCanvas, textureCanvas, GIF_SIZE, GIF_SIZE);

        console.log('📹 4. 애니메이션 프레임 캡처 중...');
        const frames = await captureAnimationFrames(viewer, 60);

        console.log('🎞️ 5. GIF 생성 중...');
        const gifBlob = await generateGIF(frames, GIF_SIZE, GIF_SIZE, 5);

        console.log('☁️ 6. GIF IPFS 업로드 중...');
        const gifCID = await uploadGIFToIPFS(gifBlob, `minecraft-pfp-${options.tokenId}.gif`);

        console.log('📝 7. 메타데이터 생성 중...');
        const metadata = generateMetadata(
            options.tokenId,
            traits,
            options.wealthTier,
            options.specialItem,
            options.totalWealthUSD,
            options.solValueUSD,
            gifCID,
            Math.floor(Date.now() / 1000),
            options.contractAddress,
            options.hasCCIPAttestation || false
        );

        console.log('☁️ 8. 메타데이터 IPFS 업로드 중...');
        const metadataCID = await uploadMetadataToIPFS(metadata);
        const metadataUri = getIPFSUri(metadataCID);

        console.log('🧹 9. 리소스 정리 중...');
        disposeScene(viewer);

        console.log('✅ 민팅 파이프라인 완료!');

        return {
            traits,
            gifCID,
            metadataCID,
            metadataUri,
        };
    } catch (error) {
        console.error('❌ 민팅 파이프라인 실패:', error);
        throw error;
    }
}

/**
 * 미리보기용 간소화된 파이프라인
 * (IPFS 업로드 없이 GIF만 생성)
 */
export async function executePreviewPipeline(
    address: string
): Promise<{
    traits: SkinTraits;
    gifBlob: Blob;
}> {
    try {
        console.log('🎨 스킨 데이터 가져오기 중...');

        // DB에서 저장된 스킨 데이터 가져오기 (API 호출)
        let traits: SkinTraits;
        let skinImageUrl: string | null = null;

        try {
            const response = await fetch(`/api/skin/${address}`);
            if (response.ok) {
                const data = await response.json();
                traits = data.traits;
                skinImageUrl = data.imageUrl;
                console.log('✅ DB에서 스킨 데이터 가져옴:', data.cached ? '캐시됨' : '새로 생성됨');
            } else {
                console.warn('⚠️ API 호출 실패, 로컬에서 생성');
                traits = generateTraits(address);
            }
        } catch (fetchError) {
            console.warn('⚠️ API 호출 에러, 로컬에서 생성:', fetchError);
            traits = generateTraits(address);
        }

        console.log('🖼️ 스킨 텍스처 준비 중...');
        let textureCanvas: HTMLCanvasElement;

        if (skinImageUrl) {
            // DB에 저장된 이미지 사용 (AI 생성 또는 기존 스킨)
            console.log('📥 DB 이미지 로드 중:', skinImageUrl);
            textureCanvas = await loadImageToCanvas(skinImageUrl);
        } else {
            // 로컬에서 텍스처 생성 (폴백)
            console.log('🎨 로컬에서 텍스처 생성 중...');
            textureCanvas = createSkinTexture(traits);
        }

        console.log('🎬 3D 씬 설정 중...');
        const renderCanvas = document.createElement('canvas');
        const GIF_SIZE = 384; // Preview와 동일한 크기
        const viewer = await createMinecraftScene(renderCanvas, textureCanvas, GIF_SIZE, GIF_SIZE);

        console.log('📹 애니메이션 프레임 캡처 중...');
        const frames = await captureAnimationFrames(viewer, 60);

        console.log('🎞️ GIF 생성 중...');
        const gifBlob = await generateGIF(frames, GIF_SIZE, GIF_SIZE, 5);

        console.log('🧹 리소스 정리 중...');
        disposeScene(viewer);

        console.log('✅ 미리보기 완료!');

        return {
            traits,
            gifBlob,
        };
    } catch (error) {
        console.error('❌ 미리보기 실패:', error);
        throw error;
    }
}

/**
 * 이미지 URL을 캔버스로 로드
 */
async function loadImageToCanvas(imageUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CORS 설정

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context를 가져올 수 없습니다'));
                return;
            }

            ctx.drawImage(img, 0, 0);
            resolve(canvas);
        };

        img.onerror = () => {
            reject(new Error(`이미지 로드 실패: ${imageUrl}`));
        };

        img.src = imageUrl;
    });
}

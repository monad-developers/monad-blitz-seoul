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
 * 1. Trait 생성
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
        console.log('🎨 1. Trait 생성 중...');
        const traits = generateTraits(options.address);

        console.log('🖼️ 2. 스킨 텍스처 생성 중...');
        const textureCanvas = createSkinTexture(traits);

        console.log('🎬 3. 3D 씬 설정 중...');
        const renderCanvas = document.createElement('canvas');
        const GIF_SIZE = 384; // Preview와 동일한 크기
        const { scene, camera, renderer, mesh } = createMinecraftScene(renderCanvas, textureCanvas, GIF_SIZE, GIF_SIZE);

        console.log('📹 4. 애니메이션 프레임 캡처 중...');
        const frames = await captureAnimationFrames(scene, camera, renderer, mesh, 60);

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
        disposeScene(scene, renderer);

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
        console.log('🎨 Trait 생성 중...');
        const traits = generateTraits(address);

        console.log('🖼️ 스킨 텍스처 생성 중...');
        const textureCanvas = createSkinTexture(traits);

        console.log('🎬 3D 씬 설정 중...');
        const renderCanvas = document.createElement('canvas');
        const GIF_SIZE = 384; // Preview와 동일한 크기
        const { scene, camera, renderer, mesh } = createMinecraftScene(renderCanvas, textureCanvas, GIF_SIZE, GIF_SIZE);

        console.log('📹 애니메이션 프레임 캡처 중...');
        const frames = await captureAnimationFrames(scene, camera, renderer, mesh, 60);

        console.log('🎞️ GIF 생성 중...');
        const gifBlob = await generateGIF(frames, GIF_SIZE, GIF_SIZE, 5);

        console.log('🧹 리소스 정리 중...');
        disposeScene(scene, renderer);

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

/**
 * GIF Generator
 *
 * 캡처된 프레임들을 GIF로 인코딩 (gifenc 사용)
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

/**
 * 프레임들을 GIF로 인코딩
 *
 * @param frames ImageData 배열
 * @param width GIF 너비
 * @param height GIF 높이
 * @param fps 초당 프레임 수
 * @returns GIF Blob
 */
export async function generateGIF(
    frames: ImageData[],
    width: number = 512,
    height: number = 512,
    fps: number = 30
): Promise<Blob> {
    console.log(`GIF 생성 시작: ${frames.length} 프레임, ${width}x${height}, ${fps}fps`);

    try {
        // GIF 인코더 생성
        const gif = GIFEncoder();

        const delay = Math.floor(1000 / fps); // ms 단위

        console.log('프레임 인코딩 중...');

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];

            // 진행 상황 로그
            if (i % 10 === 0) {
                console.log(`프레임 ${i}/${frames.length} 인코딩 중... (${((i / frames.length) * 100).toFixed(1)}%)`);
            }

            // ImageData에서 RGBA 데이터 추출
            const { data } = frame;

            // 색상 양자화 (256색 팔레트로 변환)
            const palette = quantize(data, 256);

            // 팔레트 적용하여 인덱스 배열 생성
            const index = applyPalette(data, palette);

            // GIF에 프레임 추가
            gif.writeFrame(index, width, height, {
                palette,
                delay,
                transparent: false,
            });
        }

        console.log('모든 프레임 인코딩 완료');

        // GIF 마무리
        gif.finish();

        // Uint8Array를 Blob으로 변환
        const buffer = gif.bytes();
        const blob = new Blob([buffer.buffer as ArrayBuffer], { type: 'image/gif' });

        console.log('GIF 생성 완료!', blob.size, 'bytes');

        return blob;
    } catch (error) {
        console.error('GIF 생성 중 에러:', error);
        throw error;
    }
}

/**
 * Blob을 ArrayBuffer로 변환
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Blob을 Base64로 변환
 */
export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

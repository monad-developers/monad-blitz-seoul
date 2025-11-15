/**
 * GIF Generator
 *
 * 캡처된 프레임들을 GIF로 인코딩
 */

// @ts-ignore - gif.js는 TypeScript 정의가 없음
import GIF from 'gif.js';

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
    return new Promise((resolve, reject) => {
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width,
            height,
            workerScript: '/gif.worker.js',
        });

        const delay = 1000 / fps;

        // 모든 프레임 추가
        frames.forEach((frame) => {
            gif.addFrame(frame, { delay });
        });

        // GIF 렌더링 완료 이벤트
        gif.on('finished', (blob: Blob) => {
            resolve(blob);
        });

        // 에러 처리
        gif.on('error', (error: Error) => {
            reject(error);
        });

        // 렌더링 시작
        gif.render();
    });
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

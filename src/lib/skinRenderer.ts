/**
 * Minecraft Skin Renderer
 *
 * skinview3d를 사용하여 64x64 Minecraft 스킨을 3D 모델로 렌더링
 */

import { SkinTraits } from './traitGenerator';
import { getColorFromFamily } from './traitStyles';

/**
 * 64x64 텍스처 생성
 */
export function createSkinTexture(traits: SkinTraits): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // 배경을 투명하게 설정
    ctx.clearRect(0, 0, 64, 64);

    // Minecraft 스킨 UV 매핑에 따라 각 부위 그리기
    drawSkin(ctx, traits);
    drawClothes(ctx, traits);
    drawPants(ctx, traits);
    drawShoes(ctx, traits);
    drawHat(ctx, traits);

    return canvas;
}

/**
 * 피부 그리기 (표준 Minecraft 64x64 스킨 레이아웃)
 */
function drawSkin(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    const skinColors = [
        '#FFE0BD', // Light
        '#FFCD94', // Fair
        '#EAC086', // Medium
        '#C68642', // Tan
        '#8D5524', // Dark
        '#6B4423', // Deep
    ];

    const baseColor = skinColors[traits.skinTone];
    const shade = traits.skinShade;
    const headColor = adjustBrightness(baseColor, -shade / 3);
    const bodyColor = adjustBrightness(baseColor, -shade / 4);

    // === 머리 (8x8x8) ===
    ctx.fillStyle = headColor;
    // 머리 앞면 (8, 8) - (16, 16)
    ctx.fillRect(8, 8, 8, 8);
    // 머리 뒷면 (24, 8) - (32, 16)
    ctx.fillRect(24, 8, 8, 8);
    // 머리 좌측 (0, 8) - (8, 16)
    ctx.fillRect(0, 8, 8, 8);
    // 머리 우측 (16, 8) - (24, 16)
    ctx.fillRect(16, 8, 8, 8);
    // 머리 위 (8, 0) - (16, 8)
    ctx.fillRect(8, 0, 8, 8);
    // 머리 아래 (16, 0) - (24, 8)
    ctx.fillRect(16, 0, 8, 8);

    // === 몸통 (8x12x4) ===
    ctx.fillStyle = bodyColor;
    // 몸통 앞면 (20, 20) - (28, 32)
    ctx.fillRect(20, 20, 8, 12);
    // 몸통 뒷면 (32, 20) - (40, 32)
    ctx.fillRect(32, 20, 8, 12);
    // 몸통 좌측 (16, 20) - (20, 32)
    ctx.fillRect(16, 20, 4, 12);
    // 몸통 우측 (28, 20) - (32, 32)
    ctx.fillRect(28, 20, 4, 12);
    // 몸통 위 (20, 16) - (28, 20)
    ctx.fillRect(20, 16, 8, 4);
    // 몸통 아래 (28, 16) - (36, 20)
    ctx.fillRect(28, 16, 8, 4);

    // === 오른팔 (4x12x4) ===
    // 앞면 (44, 20) - (48, 32)
    ctx.fillRect(44, 20, 4, 12);
    // 뒷면 (52, 20) - (56, 32)
    ctx.fillRect(52, 20, 4, 12);
    // 좌측 (40, 20) - (44, 32)
    ctx.fillRect(40, 20, 4, 12);
    // 우측 (48, 20) - (52, 32)
    ctx.fillRect(48, 20, 4, 12);
    // 위 (44, 16) - (48, 20)
    ctx.fillRect(44, 16, 4, 4);
    // 아래 (48, 16) - (52, 20)
    ctx.fillRect(48, 16, 4, 4);

    // === 왼팔 (4x12x4) ===
    // 앞면 (36, 52) - (40, 64)
    ctx.fillRect(36, 52, 4, 12);
    // 뒷면 (44, 52) - (48, 64)
    ctx.fillRect(44, 52, 4, 12);
    // 좌측 (32, 52) - (36, 64)
    ctx.fillRect(32, 52, 4, 12);
    // 우측 (40, 52) - (44, 64)
    ctx.fillRect(40, 52, 4, 12);
    // 위 (36, 48) - (40, 52)
    ctx.fillRect(36, 48, 4, 4);
    // 아래 (40, 48) - (44, 52)
    ctx.fillRect(40, 48, 4, 4);

    // === 오른다리 (4x12x4) ===
    // 앞면 (4, 20) - (8, 32)
    ctx.fillRect(4, 20, 4, 12);
    // 뒷면 (12, 20) - (16, 32)
    ctx.fillRect(12, 20, 4, 12);
    // 좌측 (0, 20) - (4, 32)
    ctx.fillRect(0, 20, 4, 12);
    // 우측 (8, 20) - (12, 32)
    ctx.fillRect(8, 20, 4, 12);
    // 위 (4, 16) - (8, 20)
    ctx.fillRect(4, 16, 4, 4);
    // 아래 (8, 16) - (12, 20)
    ctx.fillRect(8, 16, 4, 4);

    // === 왼다리 (4x12x4) ===
    // 앞면 (20, 52) - (24, 64)
    ctx.fillRect(20, 52, 4, 12);
    // 뒷면 (28, 52) - (32, 64)
    ctx.fillRect(28, 52, 4, 12);
    // 좌측 (16, 52) - (20, 64)
    ctx.fillRect(16, 52, 4, 12);
    // 우측 (24, 52) - (28, 64)
    ctx.fillRect(24, 52, 4, 12);
    // 위 (20, 48) - (24, 52)
    ctx.fillRect(20, 48, 4, 4);
    // 아래 (24, 48) - (28, 52)
    ctx.fillRect(24, 48, 4, 4);
}

/**
 * 옷 그리기 (외부 레이어)
 * 공식 Minecraft 64x64 스킨 사양 기준 (github.com/minotar/skin-spec)
 */
function drawClothes(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.clothesStyle === 14) return; // None

    const color = getColorFromFamily(traits.clothesColor, traits.clothesOpacity, traits.clothesStyle);
    ctx.globalAlpha = traits.clothesOpacity / 255;
    ctx.fillStyle = color.base;

    // === 몸통 외부 레이어 (Torso Layer 2) ===
    ctx.fillRect(20, 36, 8, 12); // 앞면 (20,36,28,48)
    ctx.fillRect(32, 36, 8, 12); // 뒷면 (32,36,40,48)
    ctx.fillRect(16, 36, 4, 12); // 우측 (16,36,20,48)
    ctx.fillRect(28, 36, 4, 12); // 좌측 (28,36,32,48)
    ctx.fillRect(20, 32, 8, 4);  // 위 (20,32,28,36)
    ctx.fillRect(28, 32, 8, 4);  // 아래 (28,32,36,36)

    // === 오른팔 외부 레이어 (Right Arm Layer 2) ===
    ctx.fillRect(44, 36, 4, 12); // 앞면 (44,36,48,48)
    ctx.fillRect(52, 36, 4, 12); // 뒷면 (52,36,56,48)
    ctx.fillRect(40, 36, 4, 12); // 우측 (40,36,44,48)
    ctx.fillRect(48, 36, 4, 12); // 좌측 (48,36,52,48)
    ctx.fillRect(44, 32, 4, 4);  // 위 (44,32,48,36)
    ctx.fillRect(48, 32, 4, 4);  // 아래 (48,32,52,36)

    // === 왼팔 외부 레이어 (Left Arm Layer 2) ===
    ctx.fillRect(36, 52, 4, 12); // 앞면 (36,52,40,64)
    ctx.fillRect(44, 52, 4, 12); // 뒷면 (44,52,48,64)
    ctx.fillRect(32, 52, 4, 12); // 우측 (32,52,36,64)
    ctx.fillRect(40, 52, 4, 12); // 좌측 (40,52,44,64)
    ctx.fillRect(36, 48, 4, 4);  // 위 (36,48,40,52)
    ctx.fillRect(40, 48, 4, 4);  // 아래 (40,48,44,52)

    ctx.globalAlpha = 1.0;
}

/**
 * 바지 그리기 (외부 레이어)
 * 공식 Minecraft 64x64 스킨 사양 기준 (github.com/minotar/skin-spec)
 */
function drawPants(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.pantsStyle === 11) return; // None

    const color = getColorFromFamily(traits.pantsColor, traits.pantsOpacity, traits.pantsStyle);
    ctx.globalAlpha = traits.pantsOpacity / 255;
    ctx.fillStyle = color.base;

    // === 오른다리 외부 레이어 (Right Leg Layer 2) ===
    ctx.fillRect(4, 36, 4, 12);   // 앞면 (4,36,8,48)
    ctx.fillRect(12, 36, 4, 12);  // 뒷면 (12,36,16,48)
    ctx.fillRect(0, 36, 4, 12);   // 우측 (0,36,4,48)
    ctx.fillRect(8, 36, 4, 12);   // 좌측 (8,36,12,48)
    ctx.fillRect(4, 32, 4, 4);    // 위 (4,32,8,36)
    ctx.fillRect(8, 32, 4, 4);    // 아래 (8,32,12,36)

    // === 왼다리 외부 레이어 (Left Leg Layer 2) ===
    ctx.fillRect(20, 52, 4, 12);  // 앞면 (20,52,24,64)
    ctx.fillRect(28, 52, 4, 12);  // 뒷면 (28,52,32,64)
    ctx.fillRect(16, 52, 4, 12);  // 우측 (16,52,20,64)
    ctx.fillRect(24, 52, 4, 12);  // 좌측 (24,52,28,64)
    ctx.fillRect(20, 48, 4, 4);   // 위 (20,48,24,52)
    ctx.fillRect(24, 48, 4, 4);   // 아래 (24,48,28,52)

    ctx.globalAlpha = 1.0;
}

/**
 * 신발 그리기 (다리 외부 레이어 하단부)
 * 공식 Minecraft 64x64 스킨 사양 기준 (github.com/minotar/skin-spec)
 */
function drawShoes(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.shoesStyle === 7) return; // Barefoot

    const color = getColorFromFamily(traits.shoesColor, traits.shoesOpacity, traits.shoesStyle);
    ctx.globalAlpha = traits.shoesOpacity / 255;
    ctx.fillStyle = color.dark;

    // 오른다리 외부 레이어 하단 3픽셀 (Y=45~48)
    ctx.fillRect(4, 45, 4, 3);   // 앞면
    ctx.fillRect(12, 45, 4, 3);  // 뒷면
    ctx.fillRect(0, 45, 4, 3);   // 우측
    ctx.fillRect(8, 45, 4, 3);   // 좌측

    // 왼다리 외부 레이어 하단 3픽셀 (Y=61~64)
    ctx.fillRect(20, 61, 4, 3);  // 앞면
    ctx.fillRect(28, 61, 4, 3);  // 뒷면
    ctx.fillRect(16, 61, 4, 3);  // 우측
    ctx.fillRect(24, 61, 4, 3);  // 좌측

    ctx.globalAlpha = 1.0;
}

/**
 * 모자 그리기 (머리 외부 레이어)
 */
function drawHat(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.hatStyle === 0) return; // None

    const color = getColorFromFamily(traits.hatColor, traits.hatOpacity, traits.hatStyle);
    ctx.globalAlpha = traits.hatOpacity / 255;
    ctx.fillStyle = color.base;

    // === 머리 외부 레이어 (표준 위치: 40,0 시작) ===
    // 모자 앞면 (40, 8) - (48, 16)
    ctx.fillRect(40, 8, 8, 8);
    // 모자 뒷면 (56, 8) - (64, 16)
    ctx.fillRect(56, 8, 8, 8);
    // 모자 좌측 (32, 8) - (40, 16)
    ctx.fillRect(32, 8, 8, 8);
    // 모자 우측 (48, 8) - (56, 16)
    ctx.fillRect(48, 8, 8, 8);
    // 모자 위 (40, 0) - (48, 8)
    ctx.fillRect(40, 0, 8, 8);
    // 모자 아래 (48, 0) - (56, 8)
    ctx.fillRect(48, 0, 8, 8);

    ctx.globalAlpha = 1.0;
}

/**
 * 색상 밝기 조정
 */
function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + percent));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + percent));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + percent));

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * skinview3d를 사용한 씬 생성
 */
export async function createMinecraftScene(
    renderCanvas: HTMLCanvasElement,
    textureCanvas: HTMLCanvasElement,
    width: number = 512,
    height: number = 512
): Promise<any> {
    // 입력 유효성 검사
    if (!renderCanvas || !textureCanvas) {
        throw new Error('렌더링 캔버스와 텍스처 캔버스가 모두 필요합니다.');
    }

    if (width <= 0 || height <= 0) {
        throw new Error('너비와 높이는 양수여야 합니다.');
    }

    // skinview3d 동적 로드
    const skinview3d = await import('skinview3d');

    // 텍스처를 Data URL로 변환
    const skinDataUrl = textureCanvas.toDataURL('image/png');
    
    // SkinViewer 생성
    const viewer = new skinview3d.SkinViewer({
        canvas: renderCanvas,
        width,
        height,
        skin: skinDataUrl,
    });

    // 카메라 설정
    viewer.zoom = 0.7;
    viewer.fov = 70;

    // 배경색 설정
    viewer.background = 0x87ceeb; // 하늘색

    return viewer;
}

/**
 * 애니메이션 프레임 캡처 (skinview3d 사용)
 */
export async function captureAnimationFrames(
    viewer: any,
    frameCount: number = 60
): Promise<ImageData[]> {
    const frames: ImageData[] = [];
    const canvas = viewer.canvas;

    // WebGL 캔버스에서 이미지 데이터를 추출하기 위한 임시 2D 캔버스 생성
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
        throw new Error('2D 컨텍스트를 생성할 수 없습니다.');
    }

    for (let i = 0; i < frameCount; i++) {
        // 회전 애니메이션
        const angle = (i / frameCount) * Math.PI * 2;
        viewer.playerObject.rotation.y = angle;

        // 렌더링
        viewer.render();

        // WebGL 캔버스를 DataURL로 변환 후 이미지로 로드
        const dataUrl = canvas.toDataURL('image/png');
        const img = new Image();

        // 이미지 로드를 Promise로 처리
        await new Promise<void>((resolve, reject) => {
            img.onload = () => {
                // 임시 캔버스에 그리기
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(img, 0, 0);

                // ImageData 추출
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                frames.push(imageData);
                resolve();
            };
            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = dataUrl;
        });

        // 다음 프레임까지 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 / 30)); // 30 FPS
    }

    return frames;
}

/**
 * 씬 정리 (skinview3d 사용)
 */
export function disposeScene(viewer: any) {
    if (viewer && viewer.dispose) {
        viewer.dispose();
    }
}

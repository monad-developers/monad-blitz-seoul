/**
 * Minecraft Skin Renderer
 *
 * Three.js를 사용하여 64x64 Minecraft 스킨을 3D 모델로 렌더링
 */

import * as THREE from 'three';
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
 * 피부 그리기
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

    // 얼굴 (8x8 at 8,8)
    ctx.fillStyle = adjustBrightness(baseColor, -shade / 2);
    ctx.fillRect(8, 8, 8, 8);

    // 머리 앞면 (8x8 at 8,8)
    ctx.fillStyle = adjustBrightness(baseColor, -shade / 3);
    ctx.fillRect(8, 8, 8, 8);

    // 몸통 (8x12 at 20,20)
    ctx.fillStyle = adjustBrightness(baseColor, -shade / 4);
    ctx.fillRect(20, 20, 8, 12);

    // 팔 (4x12 each)
    ctx.fillRect(44, 20, 4, 12); // 오른팔
    ctx.fillRect(36, 52, 4, 12); // 왼팔

    // 다리 (4x12 each)
    ctx.fillRect(4, 20, 4, 12); // 오른다리
    ctx.fillRect(20, 52, 4, 12); // 왼다리
}

/**
 * 옷 그리기
 */
function drawClothes(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.clothesStyle === 14) return; // None

    const color = getColorFromFamily(traits.clothesColor, traits.clothesOpacity, traits.clothesStyle);
    ctx.globalAlpha = traits.clothesOpacity / 255;
    ctx.fillStyle = color.base;

    // 몸통 덮기 (20,20)
    ctx.fillRect(20, 20, 8, 12);

    // 팔 덮기
    ctx.fillRect(44, 20, 4, 12);
    ctx.fillRect(36, 52, 4, 12);

    ctx.globalAlpha = 1.0;
}

/**
 * 바지 그리기
 */
function drawPants(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.pantsStyle === 11) return; // None

    const color = getColorFromFamily(traits.pantsColor, traits.pantsOpacity, traits.pantsStyle);
    ctx.globalAlpha = traits.pantsOpacity / 255;
    ctx.fillStyle = color.base;

    // 다리 덮기
    ctx.fillRect(4, 20, 4, 12);
    ctx.fillRect(20, 52, 4, 12);

    ctx.globalAlpha = 1.0;
}

/**
 * 신발 그리기
 */
function drawShoes(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.shoesStyle === 7) return; // Barefoot

    const color = getColorFromFamily(traits.shoesColor, traits.shoesOpacity, traits.shoesStyle);
    ctx.globalAlpha = traits.shoesOpacity / 255;
    ctx.fillStyle = color.dark;

    // 발 부분 (다리 아래 2픽셀)
    ctx.fillRect(4, 30, 4, 2);
    ctx.fillRect(20, 62, 4, 2);

    ctx.globalAlpha = 1.0;
}

/**
 * 모자 그리기
 */
function drawHat(ctx: CanvasRenderingContext2D, traits: SkinTraits) {
    if (traits.hatStyle === 0) return; // None

    const color = getColorFromFamily(traits.hatColor, traits.hatOpacity, traits.hatStyle);
    ctx.globalAlpha = traits.hatOpacity / 255;
    ctx.fillStyle = color.base;

    // 모자 레이어 (40,8)
    ctx.fillRect(40, 8, 8, 8);

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
 * Three.js 씬 생성
 */
export function createMinecraftScene(
    canvas: HTMLCanvasElement,
    width: number = 512,
    height: number = 512
): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh;
} {
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 하늘색 배경

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Minecraft 캐릭터 모델 생성 (간단한 박스 모델)
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    scene.add(mesh);

    return { scene, camera, renderer, mesh };
}

/**
 * 애니메이션 프레임 캡처
 */
export async function captureAnimationFrames(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    mesh: THREE.Mesh,
    frameCount: number = 60
): Promise<ImageData[]> {
    const frames: ImageData[] = [];
    const canvas = renderer.domElement;

    for (let i = 0; i < frameCount; i++) {
        // 회전 애니메이션
        mesh.rotation.y = (i / frameCount) * Math.PI * 2;

        // 렌더링
        renderer.render(scene, camera);

        // 프레임 캡처
        const ctx = canvas.getContext('2d')!;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);

        // 다음 프레임까지 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 / 30)); // 30 FPS
    }

    return frames;
}

/**
 * 씬 정리
 */
export function disposeScene(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
) {
    scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
                object.material.dispose();
            }
        }
    });

    renderer.dispose();
}

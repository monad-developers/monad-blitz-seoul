# GIF 생성 파이프라인

## 🎬 프레임 캡처

### 1. 기본 구조

```typescript
async function captureAnimationFrames(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    frameCount: number = 60
): Promise<ImageData[]> {
    const frames: ImageData[] = [];

    for (let i = 0; i < frameCount; i++) {
        // 애니메이션 업데이트
        const progress = i / frameCount;
        updateAnimation(scene, progress);

        // 렌더링
        renderer.render(scene, camera);

        // 프레임 캡처
        const canvas = renderer.domElement;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);

        // 파티클 애니메이션 업데이트
        updateParticles(scene);
    }

    return frames;
}
```

### 2. 애니메이션 업데이트

```typescript
function updateAnimation(scene: THREE.Scene, progress: number) {
    // 모델 회전
    const model = scene.getObjectByName('character');
    if (model) {
        model.rotation.y = progress * Math.PI * 2;
    }

    // 파티클 위치 업데이트
    scene.traverse((object) => {
        if (object instanceof THREE.Points) {
            updateParticlePositions(object, progress);
        }
    });

    // 오라 효과 업데이트
    const aura = scene.getObjectByName('aura');
    if (aura && aura.material instanceof THREE.ShaderMaterial) {
        aura.material.uniforms.time.value = progress * 10;
    }
}
```

### 3. 파티클 업데이트

```typescript
function updateParticles(scene: THREE.Scene) {
    const delta = 1 / 60; // 60 FPS

    scene.traverse((object) => {
        if (object instanceof THREE.Points) {
            const positions = object.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                // Y축 상승
                positions[i + 1] += delta * 0.5;

                // 범위 초과 시 리셋
                if (positions[i + 1] > 2) {
                    positions[i + 1] = -2;
                }
            }

            object.geometry.attributes.position.needsUpdate = true;
        }
    });
}
```

---

## 🎞️ GIF 인코딩

### 1. gif.js 라이브러리 사용

```bash
npm install gif.js
```

### 2. GIF 생성 함수

```typescript
import GIF from 'gif.js';

async function createGIF(frames: ImageData[]): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const gif = new GIF({
            workers: 4,
            quality: 10,
            width: 512,
            height: 512,
            repeat: 0, // 무한 반복
            workerScript: '/gif.worker.js',
        });

        frames.forEach((frame) => {
            gif.addFrame(frame, { delay: 33 }); // ~30 FPS
        });

        gif.on('finished', (blob) => {
            resolve(blob);
        });

        gif.on('error', (error) => {
            reject(error);
        });

        gif.on('progress', (progress) => {
            console.log(`GIF encoding: ${(progress * 100).toFixed(1)}%`);
        });

        gif.render();
    });
}
```

### 3. 설정 옵션

```typescript
interface GIFOptions {
    workers: number; // 워커 스레드 수 (4-8 권장)
    quality: number; // 품질 (1-30, 낮을수록 좋음)
    width: number; // 너비
    height: number; // 높이
    repeat: number; // 반복 횟수 (0 = 무한)
    transparent: string | null; // 투명 색상
    dither: boolean; // 디더링 활성화
}

const options: GIFOptions = {
    workers: 4,
    quality: 10,
    width: 512,
    height: 512,
    repeat: 0,
    transparent: null,
    dither: false,
};
```

---

## ☁️ IPFS 업로드

### 1. Pinata SDK 설정

```bash
npm install pinata-web3
```

```typescript
import { PinataSDK } from 'pinata-web3';

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY,
});
```

### 2. GIF 업로드

```typescript
async function uploadGIFToIPFS(gifBlob: Blob): Promise<string> {
    const gifFile = new File([gifBlob], 'minecraft-pfp.gif', {
        type: 'image/gif',
    });

    const upload = await pinata.upload.file(gifFile);
    const cid = upload.IpfsHash;

    console.log(`GIF uploaded to IPFS: ${cid}`);
    return cid;
}
```

### 3. 메타데이터 업로드

```typescript
async function uploadMetadataToIPFS(
    gifCID: string,
    tokenId: string,
    traits: SkinTraits,
    wealthTier: number,
    specialItem: number,
    totalWealthUSD: string
): Promise<string> {
    const metadata = {
        name: `Minecraft PFP #${tokenId}`,
        description:
            'Dynamic Minecraft-style PFP NFT with wealth-based traits. Generated deterministically from wallet address with special items based on portfolio value at mint time.',
        image: `ipfs://${gifCID}`,
        animation_url: `ipfs://${gifCID}`,
        attributes: [
            { trait_type: 'Hat Style', value: traits.hatStyle },
            { trait_type: 'Hat Color', value: getColorName(traits.hatColor) },
            { trait_type: 'Hat Opacity', value: traits.hatOpacity },
            { trait_type: 'Clothes Style', value: traits.clothesStyle },
            { trait_type: 'Clothes Color', value: getColorName(traits.clothesColor) },
            { trait_type: 'Clothes Opacity', value: traits.clothesOpacity },
            { trait_type: 'Shoes Style', value: traits.shoesStyle },
            { trait_type: 'Shoes Color', value: getColorName(traits.shoesColor) },
            { trait_type: 'Shoes Opacity', value: traits.shoesOpacity },
            { trait_type: 'Pants Style', value: traits.pantsStyle },
            { trait_type: 'Pants Color', value: getColorName(traits.pantsColor) },
            { trait_type: 'Pants Opacity', value: traits.pantsOpacity },
            { trait_type: 'Skin Tone', value: traits.skinTone },
            { trait_type: 'Skin Shade', value: traits.skinShade },
            {
                trait_type: 'Wealth Tier',
                value: getTierName(wealthTier),
                display_type: 'string',
            },
            {
                trait_type: 'Total Wealth (USD)',
                value: parseFloat(totalWealthUSD),
                display_type: 'number',
            },
            { trait_type: 'Special Item', value: getItemName(specialItem) },
        ],
        properties: {
            category: 'pfp',
            files: [
                {
                    uri: `ipfs://${gifCID}`,
                    type: 'image/gif',
                },
            ],
        },
    };

    const upload = await pinata.upload.json(metadata);
    const cid = upload.IpfsHash;

    console.log(`Metadata uploaded to IPFS: ${cid}`);
    return cid;
}
```

### 4. 통합 업로드 함수

```typescript
async function uploadToIPFS(
    gifBlob: Blob,
    metadata: {
        tokenId: string;
        traits: SkinTraits;
        wealthTier: number;
        specialItem: number;
        totalWealthUSD: string;
    }
): Promise<{ gifCID: string; metadataCID: string }> {
    // GIF 업로드
    const gifCID = await uploadGIFToIPFS(gifBlob);

    // 메타데이터 업로드
    const metadataCID = await uploadMetadataToIPFS(
        gifCID,
        metadata.tokenId,
        metadata.traits,
        metadata.wealthTier,
        metadata.specialItem,
        metadata.totalWealthUSD
    );

    return { gifCID, metadataCID };
}
```

---

## 🔄 전체 파이프라인

```typescript
async function generateAndUploadNFT(
    address: string,
    traits: SkinTraits,
    wealthTier: number,
    specialItem: number,
    totalWealthUSD: string
): Promise<{ gifCID: string; metadataCID: string }> {
    console.log('Starting NFT generation pipeline...');

    // 1. Three.js 씬 렌더링
    console.log('Step 1/4: Rendering 3D scene...');
    const { scene, camera, renderer } = await renderMinecraftSkin(
        address,
        traits,
        wealthTier,
        specialItem
    );

    // 2. 프레임 캡처
    console.log('Step 2/4: Capturing animation frames...');
    const frames = await captureAnimationFrames(scene, camera, renderer, 60);

    // 3. GIF 생성
    console.log('Step 3/4: Encoding GIF...');
    const gifBlob = await createGIF(frames);

    // 4. IPFS 업로드
    console.log('Step 4/4: Uploading to IPFS...');
    const { gifCID, metadataCID } = await uploadToIPFS(gifBlob, {
        tokenId: 'TBD',
        traits,
        wealthTier,
        specialItem,
        totalWealthUSD,
    });

    console.log('Pipeline complete!');
    console.log(`GIF: ipfs://${gifCID}`);
    console.log(`Metadata: ipfs://${metadataCID}`);

    // 정리
    renderer.dispose();

    return { gifCID, metadataCID };
}
```

---

## ⚡ 최적화

### 1. 프레임 수 조정

```typescript
// 낮은 품질 (빠름)
const frames = await captureAnimationFrames(scene, camera, renderer, 30);

// 표준 품질
const frames = await captureAnimationFrames(scene, camera, renderer, 60);

// 높은 품질 (느림)
const frames = await captureAnimationFrames(scene, camera, renderer, 120);
```

### 2. GIF 품질 설정

```typescript
// 빠른 인코딩 (낮은 품질)
const gif = new GIF({
    workers: 2,
    quality: 20,
    // ...
});

// 균형잡힌 설정
const gif = new GIF({
    workers: 4,
    quality: 10,
    // ...
});

// 최고 품질 (느림)
const gif = new GIF({
    workers: 8,
    quality: 1,
    // ...
});
```

### 3. 캐싱 전략

```typescript
// 3D 모델 캐싱
const modelCache = new Map<string, THREE.Object3D>();

async function loadMinecraftModel(): Promise<THREE.Object3D> {
    const cacheKey = 'minecraft-base-model';

    if (modelCache.has(cacheKey)) {
        return modelCache.get(cacheKey).clone();
    }

    const model = await loader.load('/models/minecraft-skin.glb');
    modelCache.set(cacheKey, model);

    return model.clone();
}
```

---

## 🐛 에러 처리

```typescript
async function generateWithErrorHandling(
    address: string,
    traits: SkinTraits,
    wealthTier: number,
    specialItem: number,
    totalWealthUSD: string
): Promise<{ gifCID: string; metadataCID: string }> {
    try {
        return await generateAndUploadNFT(
            address,
            traits,
            wealthTier,
            specialItem,
            totalWealthUSD
        );
    } catch (error) {
        console.error('NFT generation failed:', error);

        // 렌더링 실패
        if (error.message.includes('render')) {
            throw new Error('3D rendering failed. Please try again.');
        }

        // GIF 인코딩 실패
        if (error.message.includes('GIF')) {
            throw new Error('GIF encoding failed. Please try again.');
        }

        // IPFS 업로드 실패
        if (error.message.includes('IPFS') || error.message.includes('Pinata')) {
            throw new Error('IPFS upload failed. Please check your connection.');
        }

        throw error;
    }
}
```

---

## 📊 진행 상태 추적

```typescript
interface ProgressCallback {
    (stage: string, progress: number): void;
}

async function generateWithProgress(
    address: string,
    traits: SkinTraits,
    wealthTier: number,
    specialItem: number,
    totalWealthUSD: string,
    onProgress: ProgressCallback
): Promise<{ gifCID: string; metadataCID: string }> {
    onProgress('Rendering 3D scene', 0);
    const { scene, camera, renderer } = await renderMinecraftSkin(
        address,
        traits,
        wealthTier,
        specialItem
    );

    onProgress('Capturing frames', 25);
    const frames = await captureAnimationFrames(scene, camera, renderer, 60);

    onProgress('Encoding GIF', 50);
    const gifBlob = await createGIF(frames);

    onProgress('Uploading to IPFS', 75);
    const result = await uploadToIPFS(gifBlob, {
        tokenId: 'TBD',
        traits,
        wealthTier,
        specialItem,
        totalWealthUSD,
    });

    onProgress('Complete', 100);
    return result;
}
```

---

## 🔍 디버깅 도구

```typescript
// GIF 미리보기
async function previewGIF(gifBlob: Blob): Promise<string> {
    return URL.createObjectURL(gifBlob);
}

// 프레임 디버깅
async function saveFrames(frames: ImageData[], outputDir: string) {
    for (let i = 0; i < frames.length; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = frames[i].width;
        canvas.height = frames[i].height;

        const ctx = canvas.getContext('2d');
        ctx.putImageData(frames[i], 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });

        // 다운로드 또는 저장
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frame-${i.toString().padStart(3, '0')}.png`;
        a.click();
    }
}
```

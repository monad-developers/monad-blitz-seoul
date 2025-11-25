# Three.js 렌더링 시스템

## 🎮 마인크래프트 스킨 구조

### 1. UV 매핑 (64x64 텍스처)

```
        [Hat Layer]
[Head] [Right Arm] [Body] [Left Arm] [Right Leg] [Left Leg]
        [Head]
```

### 2. 3D 모델 구성

```typescript
// 기본 박스 지오메트리
const headGeometry = new THREE.BoxGeometry(8, 8, 8);
const bodyGeometry = new THREE.BoxGeometry(8, 12, 4);
const armGeometry = new THREE.BoxGeometry(4, 12, 4);
const legGeometry = new THREE.BoxGeometry(4, 12, 4);
```

---

## 🎨 색상 적용 시스템

### 1. 기본 구조

```typescript
function applyColors(model: THREE.Group, traits: SkinTraits) {
    // 모자 색상 적용
    const hatColor = getColorFromTraits(
        traits.hatColor,
        traits.hatStyle,
        traits.hatOpacity
    );

    const hatMesh = model.getObjectByName('hat');
    hatMesh.material = new THREE.MeshStandardMaterial({
        color: hatColor.hex,
        transparent: true,
        opacity: hatColor.opacity,
        roughness: 0.7,
        metalness: 0.3,
    });

    // 옷, 신발, 바지도 동일하게 적용
}
```

### 2. 색상 팔레트 적용

```typescript
function getColorFromTraits(
    colorFamily: number,
    styleIndex: number,
    opacity: number
): ColorResult {
    const familyName = COLOR_FAMILY_NAMES[colorFamily];
    const palette = COLOR_PALETTES[familyName];
    const colorIndex = styleIndex % palette.length;
    const selectedColor = palette[colorIndex];

    return {
        hex: selectedColor.base,
        opacity: opacity / 255,
        light: selectedColor.light,
        dark: selectedColor.dark,
    };
}
```

---

## ✨ Special Item 렌더링

### 1. 기본 구조

```typescript
async function addSpecialItem(
    model: THREE.Group,
    itemId: number,
    wealthTier: number
) {
    if (itemId === 0) return;

    const itemConfig = SPECIAL_ITEMS[itemId];
    const itemModel = await loadGLTFModel(itemConfig.model);

    // 글로우 효과
    if (itemConfig.glow) {
        applyGlowEffect(itemModel, itemConfig.glowColor, itemConfig.intensity);
    }

    // 파티클 시스템
    if (itemConfig.particles) {
        const particles = createParticleSystem(itemConfig.glowColor);
        itemModel.add(particles);
    }

    // 오라 효과
    if (itemConfig.aura) {
        const aura = createAuraEffect(itemConfig.aura);
        model.add(aura);
    }

    // 위치 설정
    positionItem(itemModel, itemConfig.type);
    model.add(itemModel);
}
```

### 2. 아이템 설정 예제

```typescript
const SPECIAL_ITEMS = {
    1: {
        name: 'Wooden Sword',
        model: '/models/wooden_sword.glb',
        type: 'weapon',
        glow: false,
        particles: false,
        aura: null,
    },
    15: {
        name: 'Legendary Blade',
        model: '/models/legendary_blade.glb',
        type: 'weapon',
        glow: true,
        glowColor: '#FF1493',
        intensity: 1.0,
        particles: true,
        particleCount: 200,
        aura: 'rainbow',
    },
};
```

---

## 💫 글로우 효과

### 1. 기본 글로우

```typescript
function applyGlowEffect(
    model: THREE.Object3D,
    color: string,
    intensity: number
) {
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: intensity,
                roughness: 0.3,
                metalness: 0.8,
            });
        }
    });
}
```

### 2. 강도별 설정

| Tier | Intensity | 설명 |
|------|-----------|------|
| Silver | 0.5 | 은은한 빛 |
| Gold | 0.7 | 중간 강도 |
| Platinum | 0.9 | 강한 빛 |
| Diamond | 1.0 | 최대 강도 |

---

## ⭐ 파티클 시스템

### 1. 기본 파티클

```typescript
function createParticleSystem(color: string): THREE.Points {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: color,
        size: 0.05,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
}
```

### 2. 파티클 애니메이션

```typescript
function animateParticles(particles: THREE.Points, delta: number) {
    const positions = particles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        // Y축 상승
        positions[i + 1] += delta * 0.5;

        // 범위 초과 시 리셋
        if (positions[i + 1] > 2) {
            positions[i + 1] = -2;
        }

        // X, Z축 회전
        const angle = Date.now() * 0.001;
        positions[i] = Math.cos(angle + i) * 0.5;
        positions[i + 2] = Math.sin(angle + i) * 0.5;
    }

    particles.geometry.attributes.position.needsUpdate = true;
}
```

---

## 🌈 오라 효과

### 1. 무지개 오라

```typescript
function createRainbowRing(): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
    });

    const ring = new THREE.Mesh(geometry, material);

    // 무지개 색상 애니메이션
    const animate = () => {
        const hue = (Date.now() * 0.0001) % 1;
        material.color.setHSL(hue, 1, 0.5);
    };

    return ring;
}
```

### 2. 불 오라

```typescript
function createFireParticles(): THREE.Points {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // 위치: 원형 배치
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 1 + Math.random() * 0.5;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = Math.random() * 2;
        positions[i3 + 2] = Math.sin(angle) * radius;

        // 색상: 불 색상 (빨강-주황-노랑)
        const heat = Math.random();
        colors[i3] = 1; // R
        colors[i3 + 1] = heat * 0.5; // G
        colors[i3 + 2] = 0; // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
}
```

### 3. 별 오라

```typescript
function createStarParticles(): THREE.Points {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffaa,
        size: 0.15,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        map: createStarTexture(),
    });

    return new THREE.Points(geometry, material);
}

function createStarTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}
```

### 4. 우주 오라

```typescript
function createCosmicEffect(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                vec3 color = vec3(0.0);

                // 성운 효과
                float nebula = sin(uv.x * 10.0 + time) * cos(uv.y * 10.0 + time);
                color += vec3(0.5, 0.0, 0.8) * nebula;

                // 별 효과
                float stars = step(0.98, fract(sin(dot(uv * 100.0, vec2(12.9898, 78.233))) * 43758.5453));
                color += vec3(1.0) * stars;

                gl_FragColor = vec4(color, 0.5);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
}
```

### 5. 신성한 오라

```typescript
function createDivineLight(): THREE.PointLight {
    const light = new THREE.PointLight(0xffffff, 2, 10);
    light.position.set(0, 3, 0);

    // 빛 기둥 추가
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
    });

    const pillar = new THREE.Mesh(geometry, material);
    pillar.position.y = 2.5;
    light.add(pillar);

    return light;
}
```

---

## 🎬 애니메이션 시스템

### 1. 애니메이션 정의

```typescript
const ANIMATIONS = {
    idle: {
        // 대기 자세: 팔 살짝 흔들기
        rightArm: { rotation: { x: 0.1, z: 0 } },
        leftArm: { rotation: { x: -0.1, z: 0 } },
        duration: 2000,
    },
    walk: {
        // 걷기: 팔다리 교차 움직임
        rightArm: { rotation: { x: 0.5, z: 0 } },
        leftArm: { rotation: { x: -0.5, z: 0 } },
        rightLeg: { rotation: { x: -0.5, z: 0 } },
        leftLeg: { rotation: { x: 0.5, z: 0 } },
        duration: 1000,
    },
    wave: {
        // 손 흔들기
        rightArm: { rotation: { x: -1.5, z: 0.5 } },
        duration: 500,
    },
};
```

### 2. GSAP 애니메이션

```typescript
import gsap from 'gsap';

function animateModel(model: THREE.Group, animationType: string) {
    const anim = ANIMATIONS[animationType];

    Object.entries(anim).forEach(([partName, transform]) => {
        if (partName === 'duration') return;

        const part = model.getObjectByName(partName);
        if (!part) return;

        gsap.to(part.rotation, {
            ...transform.rotation,
            duration: anim.duration / 1000,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
        });
    });
}
```

### 3. 날개 애니메이션

```typescript
function animateWings(wings: THREE.Object3D) {
    const leftWing = wings.getObjectByName('leftWing');
    const rightWing = wings.getObjectByName('rightWing');

    gsap.to(leftWing.rotation, {
        z: 0.3,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
    });

    gsap.to(rightWing.rotation, {
        z: -0.3,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
    });
}
```

---

## 🎥 렌더링 설정

### 1. 기본 씬 설정

```typescript
function setupScene(): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
} {
    // 씬
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // 카메라
    const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 5, 0);

    // 렌더러
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
    });
    renderer.setSize(512, 512);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    return { scene, camera, renderer };
}
```

### 2. 조명 설정

```typescript
function setupLights(scene: THREE.Scene) {
    // 환경광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 주 조명
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 보조 조명
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
}
```

### 3. 회전 애니메이션

```typescript
function setupRotation(model: THREE.Group) {
    gsap.to(model.rotation, {
        y: Math.PI * 2,
        duration: 10,
        repeat: -1,
        ease: 'none',
    });
}
```

---

## 🖼️ 최종 렌더링 함수

```typescript
async function renderMinecraftSkin(
    address: string,
    traits: SkinTraits,
    wealthTier: number,
    specialItem: number
): Promise<{
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
}> {
    // 씬 설정
    const { scene, camera, renderer } = setupScene();
    setupLights(scene);

    // 캐릭터 모델 로드
    const model = await loadMinecraftModel();

    // 색상 적용
    applyColors(model, traits);

    // Special Item 추가
    await addSpecialItem(model, specialItem, wealthTier);

    // 애니메이션 시작
    animateModel(model, 'idle');
    setupRotation(model);

    // 씬에 추가
    scene.add(model);

    return { scene, camera, renderer };
}
```

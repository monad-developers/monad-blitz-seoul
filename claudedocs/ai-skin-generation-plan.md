# AI 기반 Minecraft 스킨 생성 구현 계획

## 개요

현재 프로젝트의 Minecraft PFP NFT에 AI 기반 스킨 생성 기능을 추가합니다.
- **사용 AI**: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **보안**: 서버 사이드 API 호출 (API 키 브라우저 노출 방지)
- **입력**: EVM 주소 기반 deterministic traits
- **출력**: 64x64 Minecraft 스킨 텍스처

---

## 1. 환경 설정

### 1.1 패키지 설치
```bash
pnpm add @anthropic-ai/sdk
```

### 1.2 환경 변수 설정
**파일**: `.env.local`
```bash
# Anthropic API Key (서버 전용)
ANTHROPIC_API_KEY=sk-ant-...

# 기존 설정들...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_CONTRACT_ADDRESS=...
```

**주의사항**:
- `ANTHROPIC_API_KEY`는 `NEXT_PUBLIC_` 접두사 없음 (서버 전용)
- API 키는 브라우저에 노출되지 않음

---

## 2. 서버 사이드 구현

### 2.1 AI 스킨 생성 라이브러리
**파일**: `src/lib/aiSkinGenerator.ts` (새 파일)

**주요 함수**:

```typescript
// Trait → 프롬프트 변환
function traitsToPrompt(traits: SkinTraits): string

// AI API 호출
async function generateColorScheme(prompt: string, apiKey: string): Promise<ColorScheme>

// 색상 스킴 → 64x64 Canvas 렌더링
function renderSkinFromColorScheme(colorScheme: ColorScheme): string // Base64 PNG
```

**구현 세부사항**:
1. **System Prompt**: Minecraft 스킨 디자인 전문가 역할, 64x64 레이아웃 설명
2. **User Prompt**: Trait 기반 상세 설명 (예: "Yellow Headband, Red Coat, Yellow Sneakers...")
3. **AI 응답 파싱**: JSON 색상 스킴 추출 (Markdown 코드 블록 제거)
4. **Canvas 렌더링**:
   - Node.js 환경이므로 `@napi-rs/canvas` 또는 `node-canvas` 사용 필요
   - Minecraft UV 매핑 적용 (Head, Body, Arms, Legs 각 6면)
   - 명암 효과 추가

### 2.2 Next.js API Route
**파일**: `src/app/api/generate-skin/route.ts` (새 파일)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SkinTraits } from '@/lib/traitGenerator';
import { generateAISkin } from '@/lib/aiSkinGenerator';

export async function POST(request: NextRequest) {
  try {
    const { traits }: { traits: SkinTraits } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const skinDataUrl = await generateAISkin(traits, apiKey);

    return NextResponse.json({ skinDataUrl });
  } catch (error) {
    console.error('AI skin generation failed:', error);
    return NextResponse.json(
      { error: 'Skin generation failed' },
      { status: 500 }
    );
  }
}

export const maxDuration = 30; // 타임아웃 30초
```

**엔드포인트**: `POST /api/generate-skin`

**Request**:
```json
{
  "traits": {
    "hatStyle": 5,
    "hatColor": 1,
    "clothesStyle": 11,
    ...
  }
}
```

**Response**:
```json
{
  "skinDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

---

## 3. 클라이언트 통합

### 3.1 MinecraftSkinViewer 컴포넌트 수정
**파일**: `src/components/MinecraftSkinViewer.tsx`

**변경사항**:
1. AI 생성 옵션 추가:
```typescript
interface MinecraftSkinViewerProps {
    traits: SkinTraits;
    width?: number;
    height?: number;
    autoRotate?: boolean;
    useAI?: boolean;  // 새로 추가
}
```

2. AI 스킨 생성 로직:
```typescript
useEffect(() => {
    if (useAI) {
        // API 호출
        fetch('/api/generate-skin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ traits })
        })
        .then(res => res.json())
        .then(data => {
            // AI 생성 스킨 사용
            viewer.loadSkin(data.skinDataUrl);
        })
        .catch(err => {
            // Fallback: 기존 방식
            const textureCanvas = createSkinTexture(traits);
            viewer.loadSkin(textureCanvas.toDataURL('image/png'));
        });
    } else {
        // 기존 방식 (기본값)
        const textureCanvas = createSkinTexture(traits);
        viewer.loadSkin(textureCanvas.toDataURL('image/png'));
    }
}, [traits, useAI]);
```

3. 로딩 상태 UI:
```tsx
{isGenerating && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="text-white">AI 스킨 생성 중...</div>
    </div>
)}
```

### 3.2 UI 토글 추가 (선택사항)
**파일**: `src/app/page.tsx`

```tsx
<div className="mb-4">
    <label className="flex items-center gap-2">
        <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
        />
        <span>AI 스킨 생성 사용 (더 디테일하지만 느림)</span>
    </label>
</div>

<MinecraftSkinViewer
    traits={traits}
    useAI={useAI}
/>
```

---

## 4. 참고 레포지토리 로직 이식

### 4.1 System Prompt 구조
```typescript
const SYSTEM_PROMPT = `You are a Minecraft skin designer expert...

CRITICAL REQUIREMENTS:
1. All 6 faces must have details (front, back, left, right, top, bottom)
2. Use highlight and shadow colors for 3D depth
3. Hair overlay on second layer (coordinates 40-64)
4. Shoes must be on bottom 4 pixels of legs
5. Provide detailed colors for back and side views

Return ONLY valid JSON with this structure:
{
  "head": { "skin", "hair", "hairHighlight", "eyes", ... },
  "body": { "primary", "secondary", "pattern", ... },
  "arms": { "skin", "clothing", "detail", ... },
  "legs": { "primary", "shoes", "shoeSole", ... },
  "accessories": { ... }
}
`;
```

### 4.2 Trait → Prompt 변환 예시
```typescript
function traitsToPrompt(traits: SkinTraits): string {
    const parts = [];

    // Hat
    if (traits.hatStyle !== 0) {
        parts.push(`${getStyleName('hat', traits.hatStyle)} in ${COLOR_FAMILY_NAMES[traits.hatColor]}`);
    }

    // Clothes
    parts.push(`${getStyleName('clothes', traits.clothesStyle)} in ${COLOR_FAMILY_NAMES[traits.clothesColor]}`);

    // Shoes
    parts.push(`${getStyleName('shoes', traits.shoesStyle)} in ${COLOR_FAMILY_NAMES[traits.shoesColor]}`);

    // Pants
    if (traits.pantsStyle !== 11) {
        parts.push(`${getStyleName('pants', traits.pantsStyle)} in ${COLOR_FAMILY_NAMES[traits.pantsColor]}`);
    }

    // Skin
    parts.push(`${getStyleName('skin', traits.skinTone)} skin tone`);

    return `A Minecraft character with: ${parts.join(', ')}. Make it detailed and visually appealing.`;
}
```

### 4.3 64x64 UV 매핑 좌표
```typescript
// Head (8x8x8)
const HEAD_COORDS = {
    top: { x: 8, y: 0, w: 8, h: 8 },
    bottom: { x: 16, y: 0, w: 8, h: 8 },
    front: { x: 8, y: 8, w: 8, h: 8 },
    back: { x: 24, y: 8, w: 8, h: 8 },
    right: { x: 0, y: 8, w: 8, h: 8 },
    left: { x: 16, y: 8, w: 8, h: 8 }
};

// Body (8x12x4)
const BODY_COORDS = {
    top: { x: 20, y: 16, w: 8, h: 4 },
    bottom: { x: 28, y: 16, w: 8, h: 4 },
    front: { x: 20, y: 20, w: 8, h: 12 },
    back: { x: 32, y: 20, w: 8, h: 12 },
    right: { x: 16, y: 20, w: 4, h: 12 },
    left: { x: 28, y: 20, w: 4, h: 12 }
};

// Right Arm (4x12x4)
// Left Arm (4x12x4)
// Right Leg (4x12x4)
// Left Leg (4x12x4)
// ...
```

---

## 5. 에러 처리 및 최적화

### 5.1 Fallback 전략
```typescript
try {
    // AI 생성 시도
    const aiSkin = await generateAISkin(traits, apiKey);
    return aiSkin;
} catch (error) {
    console.error('AI generation failed, using fallback:', error);
    // Fallback: 기존 프로세듀럴 생성
    const textureCanvas = createSkinTexture(traits);
    return textureCanvas.toDataURL('image/png');
}
```

### 5.2 Rate Limiting (선택사항)
```typescript
// 동일 trait는 캐싱
const cacheKey = JSON.stringify(traits);
if (skinCache.has(cacheKey)) {
    return skinCache.get(cacheKey);
}
```

### 5.3 타임아웃 설정
```typescript
// API Route에서
export const maxDuration = 30; // Vercel 함수 타임아웃

// AI 호출 시
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25000);

const response = await client.messages.create({
    ...options,
    signal: controller.signal
});

clearTimeout(timeout);
```

---

## 6. 배포 고려사항

### 6.1 환경 변수 설정
- **개발**: `.env.local`에 API 키 설정
- **프로덕션**: Vercel 환경 변수에 `ANTHROPIC_API_KEY` 추가

### 6.2 비용 관리
- Claude Haiku: 매우 저렴 (~$0.25/1M input tokens)
- 예상 사용량: 프롬프트 ~2K tokens, 응답 ~1K tokens
- 1회 생성당 약 $0.001 미만

### 6.3 성능
- AI 생성: ~3-5초 소요 예상
- 기존 방식: 즉시 생성
- 사용자에게 옵션 제공 권장

---

## 7. 구현 순서

1. ✅ **환경 설정**: 패키지 설치, API 키 설정
2. ✅ **서버 라이브러리**: `aiSkinGenerator.ts` 작성
3. ✅ **API Route**: `/api/generate-skin` 구현
4. ✅ **클라이언트 통합**: `MinecraftSkinViewer` 수정
5. ✅ **테스트**: 다양한 trait 조합 테스트
6. ✅ **UI 개선**: 로딩 상태, 에러 메시지
7. ✅ **최적화**: 캐싱, 타임아웃 처리

---

## 8. 참고 파일

### 참고 레포지토리
- `ai-minecraft-skin-generator/src/utils/skinGenerator.ts`: AI 호출 및 렌더링 로직
- `ai-minecraft-skin-generator/src/components/SkinGenerator.tsx`: UI 통합 예시

### 현재 프로젝트
- `src/lib/traitGenerator.ts`: Trait 정의 및 생성
- `src/lib/skinRenderer.ts`: 기존 스킨 렌더링 (fallback 사용)
- `src/components/MinecraftSkinViewer.tsx`: 3D 뷰어

---

## 9. 테스트 체크리스트

- [ ] API 키 없을 때 fallback 동작
- [ ] AI 생성 성공 케이스
- [ ] AI 생성 실패 시 기존 방식으로 전환
- [ ] 다양한 trait 조합 테스트
- [ ] 로딩 상태 UI 확인
- [ ] 타임아웃 처리
- [ ] 응답 JSON 파싱 에러 처리

---

## 10. 향후 개선 사항

- [ ] AI 생성 결과 캐싱 (동일 trait 재사용)
- [ ] 사용자 피드백 수집 (AI vs 기존 방식)
- [ ] 프롬프트 엔지니어링 개선
- [ ] 생성 속도 최적화
- [ ] 배치 생성 지원 (여러 스킨 동시 생성)

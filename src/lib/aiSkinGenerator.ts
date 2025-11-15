/**
 * AI 기반 Minecraft 스킨 생성 라이브러리
 *
 * Claude Haiku 4.5를 사용하여 Trait 기반 스킨 생성
 * 서버 사이드 전용 (API 키 보안)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createCanvas } from '@napi-rs/canvas';
import { SkinTraits, COLOR_FAMILY_NAMES, ColorFamily } from './traitGenerator';
import { getStyleName } from './traitStyles';

/**
 * AI가 반환하는 색상 스킴 인터페이스
 */
export interface ColorScheme {
    head: {
        skin: string;
        skinShadow?: string;
        skinHighlight?: string;
        hair: string;
        hairHighlight?: string;
        eyes: string;
        mouth?: string;
        facialHair?: string;
    };
    body: {
        primary: string;
        primaryDark?: string;
        primaryLight?: string;
        secondary: string;
        pattern?: string;
        buttons?: string;
        coatPrimary?: string;
        coatDark?: string;
        coatLight?: string;
    };
    arms: {
        skin: string;
        skinShadow?: string;
        skinHighlight?: string;
        clothing: string;
        clothingDark?: string;
        clothingLight?: string;
        detail?: string;
    };
    legs: {
        primary: string;
        primaryDark?: string;
        primaryLight?: string;
        secondary?: string;
        shoes: string;
        shoesDark?: string;
        shoesLight?: string;
        shoeSole: string;
        shoeDetail?: string;
    };
    accessories?: {
        hat?: string;
        hatDetail?: string;
        belt?: string;
    };
}

/**
 * System Prompt: Minecraft 스킨 디자인 전문가
 */
const SYSTEM_PROMPT = `You are a Minecraft skin designer expert specializing in 64x64 pixel art textures.

CRITICAL REQUIREMENTS:
1. Create detailed color schemes for ALL 6 faces of each body part (front, back, left, right, top, bottom)
2. Use highlight and shadow colors for 3D depth perception
3. Hair/hat accessories go on the second layer overlay (coordinates 40-64 on x-axis)
4. Shoes must be distinguishable on bottom 3-4 pixels of legs
5. Provide specific hex colors for back and side views to ensure consistency
6. Consider the 64x64 UV mapping layout for proper texture placement

UV Mapping Reference (64x64):
- Head (8x8x8): Base at (0,8), Overlay at (32,8)
- Body (8x12x4): At (16,16)
- Right Arm (4x12x4): At (40,16)
- Left Arm (4x12x4): At (32,48)
- Right Leg (4x12x4): At (0,16)
- Left Leg (4x12x4): At (16,48)

Return ONLY valid JSON with this exact structure:
{
  "head": {
    "skin": "#RRGGBB",
    "skinShadow": "#RRGGBB",
    "skinHighlight": "#RRGGBB",
    "hair": "#RRGGBB",
    "hairHighlight": "#RRGGBB",
    "eyes": "#RRGGBB",
    "mouth": "#RRGGBB",
    "facialHair": "#RRGGBB"
  },
  "body": {
    "primary": "#RRGGBB",
    "primaryDark": "#RRGGBB",
    "primaryLight": "#RRGGBB",
    "secondary": "#RRGGBB",
    "pattern": "#RRGGBB",
    "buttons": "#RRGGBB",
    "coatPrimary": "#RRGGBB",
    "coatDark": "#RRGGBB",
    "coatLight": "#RRGGBB"
  },
  "arms": {
    "skin": "#RRGGBB",
    "skinShadow": "#RRGGBB",
    "skinHighlight": "#RRGGBB",
    "clothing": "#RRGGBB",
    "clothingDark": "#RRGGBB",
    "clothingLight": "#RRGGBB",
    "detail": "#RRGGBB"
  },
  "legs": {
    "primary": "#RRGGBB",
    "primaryDark": "#RRGGBB",
    "primaryLight": "#RRGGBB",
    "secondary": "#RRGGBB",
    "shoes": "#RRGGBB",
    "shoesDark": "#RRGGBB",
    "shoesLight": "#RRGGBB",
    "shoeSole": "#RRGGBB",
    "shoeDetail": "#RRGGBB"
  },
  "accessories": {
    "hat": "#RRGGBB",
    "hatDetail": "#RRGGBB",
    "belt": "#RRGGBB"
  }
}

NO markdown, NO explanations, ONLY the JSON object.`;

/**
 * Trait를 상세한 프롬프트로 변환
 */
function traitsToPrompt(traits: SkinTraits): string {
    const parts: string[] = [];

    // Hat
    if (traits.hatStyle !== 0) {
        const hatName = getStyleName('hat', traits.hatStyle);
        const hatColor = COLOR_FAMILY_NAMES[traits.hatColor as ColorFamily];
        parts.push(`${hatColor} ${hatName}`);
    }

    // Clothes
    if (traits.clothesStyle !== 14) {
        const clothesName = getStyleName('clothes', traits.clothesStyle);
        const clothesColor = COLOR_FAMILY_NAMES[traits.clothesColor as ColorFamily];
        parts.push(`${clothesColor} ${clothesName}`);
    }

    // Pants
    if (traits.pantsStyle !== 11) {
        const pantsName = getStyleName('pants', traits.pantsStyle);
        const pantsColor = COLOR_FAMILY_NAMES[traits.pantsColor as ColorFamily];
        parts.push(`${pantsColor} ${pantsName}`);
    }

    // Shoes
    if (traits.shoesStyle !== 7) {
        const shoesName = getStyleName('shoes', traits.shoesStyle);
        const shoesColor = COLOR_FAMILY_NAMES[traits.shoesColor as ColorFamily];
        parts.push(`${shoesColor} ${shoesName}`);
    }

    // Skin Tone
    const skinToneName = getStyleName('skin', traits.skinTone);
    parts.push(`${skinToneName} skin tone`);

    return `Design a Minecraft character skin in classic pixel art style with the following features: ${parts.join(', ')}.
Use a pixelated, slightly patchy texture with color variations for authentic retro game aesthetics.
Add subtle shading and highlights using pixel-level dithering patterns.
Apply texture variation across all 6 faces (front, back, left, right, top, bottom) to create visual depth.
Ensure the pixel art design works well in 3D when wrapped around a Minecraft player model.`;
}

/**
 * Claude API 호출하여 색상 스킴 생성
 */
async function generateColorScheme(
    prompt: string,
    apiKey: string
): Promise<ColorScheme> {
    const client = new Anthropic({ apiKey });

    try {
        const response = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        // 응답에서 텍스트 추출
        const textContent = response.content.find((c) => c.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('No text content in AI response');
        }

        let jsonText = textContent.text.trim();

        // Markdown 코드 블록 제거 (```json ... ```)
        if (jsonText.startsWith('```')) {
            jsonText = jsonText
                .replace(/^```(?:json)?\s*/, '')
                .replace(/\s*```$/, '')
                .trim();
        }

        // JSON 파싱
        const colorScheme = JSON.parse(jsonText) as ColorScheme;

        // 기본값 검증
        if (!colorScheme.head || !colorScheme.body || !colorScheme.arms || !colorScheme.legs) {
            throw new Error('Invalid color scheme structure');
        }

        // 🔍 디버깅: AI가 생성한 색상 스킴 로깅
        console.log('[AI Skin] Generated ColorScheme:', JSON.stringify(colorScheme, null, 2));

        return colorScheme;
    } catch (error) {
        console.error('AI color scheme generation failed:', error);
        throw error;
    }
}

/**
 * 64x64 UV 매핑 좌표
 */
const UV_COORDS = {
    head: {
        // 베이스 레이어
        top: { x: 8, y: 0, w: 8, h: 8 },
        bottom: { x: 16, y: 0, w: 8, h: 8 },
        front: { x: 8, y: 8, w: 8, h: 8 },
        back: { x: 24, y: 8, w: 8, h: 8 },
        right: { x: 0, y: 8, w: 8, h: 8 },
        left: { x: 16, y: 8, w: 8, h: 8 },
        // 오버레이 레이어 (모자/머리카락)
        overlayFront: { x: 40, y: 8, w: 8, h: 8 },
        overlayBack: { x: 56, y: 8, w: 8, h: 8 },
        overlayRight: { x: 32, y: 8, w: 8, h: 8 },
        overlayLeft: { x: 48, y: 8, w: 8, h: 8 },
        overlayTop: { x: 40, y: 0, w: 8, h: 8 },
        overlayBottom: { x: 48, y: 0, w: 8, h: 8 },
    },
    body: {
        top: { x: 20, y: 16, w: 8, h: 4 },
        bottom: { x: 28, y: 16, w: 8, h: 4 },
        front: { x: 20, y: 20, w: 8, h: 12 },
        back: { x: 32, y: 20, w: 8, h: 12 },
        right: { x: 16, y: 20, w: 4, h: 12 },
        left: { x: 28, y: 20, w: 4, h: 12 },
    },
    bodyOverlay: {
        top: { x: 20, y: 32, w: 8, h: 4 },
        bottom: { x: 28, y: 32, w: 8, h: 4 },
        front: { x: 20, y: 36, w: 8, h: 12 },
        back: { x: 32, y: 36, w: 8, h: 12 },
        right: { x: 16, y: 36, w: 4, h: 12 },
        left: { x: 28, y: 36, w: 4, h: 12 },
    },
    rightArm: {
        top: { x: 44, y: 16, w: 4, h: 4 },
        bottom: { x: 48, y: 16, w: 4, h: 4 },
        front: { x: 44, y: 20, w: 4, h: 12 },
        back: { x: 52, y: 20, w: 4, h: 12 },
        right: { x: 40, y: 20, w: 4, h: 12 },
        left: { x: 48, y: 20, w: 4, h: 12 },
    },
    rightArmOverlay: {
        top: { x: 44, y: 32, w: 4, h: 4 },
        bottom: { x: 48, y: 32, w: 4, h: 4 },
        front: { x: 44, y: 36, w: 4, h: 12 },
        back: { x: 52, y: 36, w: 4, h: 12 },
        right: { x: 40, y: 36, w: 4, h: 12 },
        left: { x: 48, y: 36, w: 4, h: 12 },
    },
    leftArm: {
        top: { x: 36, y: 48, w: 4, h: 4 },
        bottom: { x: 40, y: 48, w: 4, h: 4 },
        front: { x: 36, y: 52, w: 4, h: 12 },
        back: { x: 44, y: 52, w: 4, h: 12 },
        right: { x: 32, y: 52, w: 4, h: 12 },
        left: { x: 40, y: 52, w: 4, h: 12 },
    },
    leftArmOverlay: {
        top: { x: 52, y: 48, w: 4, h: 4 },
        bottom: { x: 56, y: 48, w: 4, h: 4 },
        front: { x: 52, y: 52, w: 4, h: 12 },
        back: { x: 60, y: 52, w: 4, h: 12 },
        right: { x: 48, y: 52, w: 4, h: 12 },
        left: { x: 56, y: 52, w: 4, h: 12 },
    },
    rightLeg: {
        top: { x: 4, y: 16, w: 4, h: 4 },
        bottom: { x: 8, y: 16, w: 4, h: 4 },
        front: { x: 4, y: 20, w: 4, h: 12 },
        back: { x: 12, y: 20, w: 4, h: 12 },
        right: { x: 0, y: 20, w: 4, h: 12 },
        left: { x: 8, y: 20, w: 4, h: 12 },
    },
    rightLegOverlay: {
        top: { x: 4, y: 32, w: 4, h: 4 },
        bottom: { x: 8, y: 32, w: 4, h: 4 },
        front: { x: 4, y: 36, w: 4, h: 12 },
        back: { x: 12, y: 36, w: 4, h: 12 },
        right: { x: 0, y: 36, w: 4, h: 12 },
        left: { x: 8, y: 36, w: 4, h: 12 },
    },
    leftLeg: {
        top: { x: 20, y: 48, w: 4, h: 4 },
        bottom: { x: 24, y: 48, w: 4, h: 4 },
        front: { x: 20, y: 52, w: 4, h: 12 },
        back: { x: 28, y: 52, w: 4, h: 12 },
        right: { x: 16, y: 52, w: 4, h: 12 },
        left: { x: 24, y: 52, w: 4, h: 12 },
    },
    leftLegOverlay: {
        top: { x: 4, y: 48, w: 4, h: 4 },
        bottom: { x: 8, y: 48, w: 4, h: 4 },
        front: { x: 4, y: 52, w: 4, h: 12 },
        back: { x: 12, y: 52, w: 4, h: 12 },
        right: { x: 0, y: 52, w: 4, h: 12 },
        left: { x: 8, y: 52, w: 4, h: 12 },
    },
};

/**
 * 디더링을 위한 헬퍼 함수
 */
function fillRectWithDithering(
    ctx: any,
    x: number,
    y: number,
    w: number,
    h: number,
    baseColor: string,
    darkColor: string,
    lightColor: string
) {
    // 각 픽셀마다 체커보드 패턴으로 색상 변형
    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const isEven = (px + py) % 2 === 0;
            const rand = (px * 17 + py * 31) % 3; // 의사 랜덤

            let color = baseColor;
            if (darkColor && rand === 0) color = darkColor;
            if (lightColor && rand === 2) color = lightColor;
            if (isEven && darkColor && rand === 1) color = darkColor;

            ctx.fillStyle = color;
            ctx.fillRect(x + px, y + py, 1, 1);
        }
    }
}

/**
 * 색상 스킴으로부터 64x64 Canvas 렌더링 (픽셀 아트 스타일)
 */
function renderSkinFromColorScheme(colorScheme: ColorScheme): string {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    // 투명 배경
    ctx.clearRect(0, 0, 64, 64);

    // === 머리 - 디더링 적용 ===
    const skinBase = colorScheme.head.skin;
    const skinDark = colorScheme.head.skinShadow || colorScheme.head.skin;
    const skinLight = colorScheme.head.skinHighlight || colorScheme.head.skin;

    // 앞면을 제외한 5개 면에만 디더링 적용 (얼굴은 나중에 그림)
    const headFront = UV_COORDS.head.front;
    [UV_COORDS.head.top, UV_COORDS.head.bottom, UV_COORDS.head.back, UV_COORDS.head.right, UV_COORDS.head.left].forEach((coord) => {
        fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, skinBase, skinDark, skinLight);
    });

    // 앞면은 단색으로 (얼굴을 위해)
    ctx.fillStyle = skinBase;
    ctx.fillRect(headFront.x, headFront.y, headFront.w, headFront.h);

    // 머리카락/모자 오버레이
    if (colorScheme.head.hair || colorScheme.accessories?.hat) {
        const hairBase = colorScheme.accessories?.hat || colorScheme.head.hair;
        const hairDark = colorScheme.accessories?.hatDetail || hairBase;
        const hairLight = colorScheme.head.hairHighlight || hairBase;

        Object.values(UV_COORDS.head).slice(6).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, hairBase, hairDark, hairLight);
        });
    }

    // 눈 그리기 - 더 크고 명확하게 (2x2 픽셀, 간격 1픽셀)
    if (colorScheme.head.eyes) {
        ctx.fillStyle = colorScheme.head.eyes;
        // 왼쪽 눈 (1, 2)부터 2x2
        ctx.fillRect(headFront.x + 1, headFront.y + 2, 2, 2);
        // 오른쪽 눈 (5, 2)부터 2x2
        ctx.fillRect(headFront.x + 5, headFront.y + 2, 2, 2);
    }

    // 입 그리기 - 더 두껍고 명확하게 (4x2 픽셀)
    if (colorScheme.head.mouth) {
        ctx.fillStyle = colorScheme.head.mouth;
        ctx.fillRect(headFront.x + 2, headFront.y + 5, 4, 2);
    }

    // === 몸통 - 디더링 적용 ===
    const bodyBase = colorScheme.body.primary;
    const bodyDark = colorScheme.body.primaryDark || bodyBase;
    const bodyLight = colorScheme.body.primaryLight || bodyBase;

    Object.values(UV_COORDS.body).forEach((coord) => {
        fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, bodyBase, bodyDark, bodyLight);
    });

    // 몸통 디테일
    if (colorScheme.body.secondary) {
        ctx.fillStyle = colorScheme.body.secondary;
        const bodyFront = UV_COORDS.body.front;
        ctx.fillRect(bodyFront.x + 3, bodyFront.y + 2, 2, 2);
        ctx.fillRect(bodyFront.x + 3, bodyFront.y + 5, 2, 2);
    }

    // === 몸통 외부 레이어 (옷) - 디더링 적용 ===
    if (colorScheme.body.coatPrimary || colorScheme.body.primary) {
        const coatBase = colorScheme.body.coatPrimary || colorScheme.body.primary;
        const coatDark = colorScheme.body.coatDark || colorScheme.body.primaryDark || coatBase;
        const coatLight = colorScheme.body.coatLight || colorScheme.body.primaryLight || coatBase;

        Object.values(UV_COORDS.bodyOverlay).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, coatBase, coatDark, coatLight);
        });
    }

    // === 팔 - 디더링 적용 ===
    const armSkinBase = colorScheme.arms.skin;
    const armSkinDark = colorScheme.arms.skinShadow || colorScheme.arms.skin;
    const armSkinLight = colorScheme.arms.skinHighlight || colorScheme.arms.skin;

    [UV_COORDS.rightArm, UV_COORDS.leftArm].forEach((armCoords) => {
        Object.values(armCoords).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, armSkinBase, armSkinDark, armSkinLight);
        });
    });

    // === 팔 외부 레이어 (소매) - 디더링 적용 ===
    if (colorScheme.arms.clothing) {
        const sleeveBase = colorScheme.arms.clothing;
        const sleeveDark = colorScheme.arms.clothingDark || sleeveBase;
        const sleeveLight = colorScheme.arms.clothingLight || sleeveBase;

        Object.values(UV_COORDS.rightArmOverlay).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, sleeveBase, sleeveDark, sleeveLight);
        });

        Object.values(UV_COORDS.leftArmOverlay).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, sleeveBase, sleeveDark, sleeveLight);
        });
    }

    // === 다리 베이스 레이어 - 디더링 적용 ===
    const legBase = colorScheme.legs.primary;
    const legDark = colorScheme.legs.primaryDark || legBase;
    const legLight = colorScheme.legs.primaryLight || legBase;

    [UV_COORDS.rightLeg, UV_COORDS.leftLeg].forEach((legCoords) => {
        Object.values(legCoords).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, legBase, legDark, legLight);
        });
    });

    // === 다리 외부 레이어 (바지) - 디더링 적용 ===
    if (colorScheme.legs.primary) {
        Object.values(UV_COORDS.rightLegOverlay).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, legBase, legDark, legLight);
        });

        Object.values(UV_COORDS.leftLegOverlay).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, legBase, legDark, legLight);
        });
    }

    // === 신발 (외부 레이어 하단) - 디더링 적용 ===
    if (colorScheme.legs.shoes) {
        const shoesBase = colorScheme.legs.shoes;
        const shoesDark = colorScheme.legs.shoesDark || colorScheme.legs.shoeSole || shoesBase;
        const shoesLight = colorScheme.legs.shoesLight || shoesBase;

        // 오른다리 외부 레이어 하단 3픽셀
        const rightLegOverlayFront = UV_COORDS.rightLegOverlay.front;
        fillRectWithDithering(ctx, rightLegOverlayFront.x, rightLegOverlayFront.y + 9, rightLegOverlayFront.w, 3, shoesBase, shoesDark, shoesLight);

        const rightLegOverlayBack = UV_COORDS.rightLegOverlay.back;
        fillRectWithDithering(ctx, rightLegOverlayBack.x, rightLegOverlayBack.y + 9, rightLegOverlayBack.w, 3, shoesBase, shoesDark, shoesLight);

        const rightLegOverlayRight = UV_COORDS.rightLegOverlay.right;
        fillRectWithDithering(ctx, rightLegOverlayRight.x, rightLegOverlayRight.y + 9, rightLegOverlayRight.w, 3, shoesBase, shoesDark, shoesLight);

        const rightLegOverlayLeft = UV_COORDS.rightLegOverlay.left;
        fillRectWithDithering(ctx, rightLegOverlayLeft.x, rightLegOverlayLeft.y + 9, rightLegOverlayLeft.w, 3, shoesBase, shoesDark, shoesLight);

        // 왼다리 외부 레이어 하단 3픽셀
        const leftLegOverlayFront = UV_COORDS.leftLegOverlay.front;
        fillRectWithDithering(ctx, leftLegOverlayFront.x, leftLegOverlayFront.y + 9, leftLegOverlayFront.w, 3, shoesBase, shoesDark, shoesLight);

        const leftLegOverlayBack = UV_COORDS.leftLegOverlay.back;
        fillRectWithDithering(ctx, leftLegOverlayBack.x, leftLegOverlayBack.y + 9, leftLegOverlayBack.w, 3, shoesBase, shoesDark, shoesLight);

        const leftLegOverlayRight = UV_COORDS.leftLegOverlay.right;
        fillRectWithDithering(ctx, leftLegOverlayRight.x, leftLegOverlayRight.y + 9, leftLegOverlayRight.w, 3, shoesBase, shoesDark, shoesLight);

        const leftLegOverlayLeft = UV_COORDS.leftLegOverlay.left;
        fillRectWithDithering(ctx, leftLegOverlayLeft.x, leftLegOverlayLeft.y + 9, leftLegOverlayLeft.w, 3, shoesBase, shoesDark, shoesLight);
    }

    // Canvas를 Base64 PNG로 변환
    const buffer = canvas.toBuffer('image/png');
    return `data:image/png;base64,${buffer.toString('base64')}`;
}

/**
 * AI 기반 스킨 생성 메인 함수
 */
export async function generateAISkin(
    traits: SkinTraits,
    apiKey: string
): Promise<string> {
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    try {
        // 1. Trait → 프롬프트 변환
        const prompt = traitsToPrompt(traits);
        console.log('[AI Skin] Generating with prompt:', prompt);

        // 2. AI 색상 스킴 생성
        const colorScheme = await generateColorScheme(prompt, apiKey);
        console.log('[AI Skin] Color scheme generated successfully');

        // 3. Canvas 렌더링
        const skinDataUrl = renderSkinFromColorScheme(colorScheme);
        console.log('[AI Skin] Skin texture rendered successfully');

        return skinDataUrl;
    } catch (error) {
        console.error('[AI Skin] Generation failed:', error);
        throw error;
    }
}

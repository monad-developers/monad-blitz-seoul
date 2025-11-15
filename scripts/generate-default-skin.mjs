/**
 * 기본 주소(0xf39F...2266)의 AI 스킨을 미리 생성하고 저장하는 스크립트
 */

import Anthropic from '@anthropic-ai/sdk';
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// .env.local 파일 읽기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    }
}

// 기본 주소
const DEFAULT_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

// Trait 생성 로직 (traitGenerator.ts에서 복사)
function addressToBytes(address) {
    const hex = address.toLowerCase().startsWith('0x') ? address.slice(2) : address;
    const bytes = new Uint8Array(20);

    for (let i = 0; i < 20; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    return bytes;
}

function bytesToUint32(bytes, offset) {
    return (
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]
    ) >>> 0;
}

function getColorFamily(segment) {
    if (segment % 3 === 0) return 0; // BLUE
    if (segment % 5 === 0) return 1; // YELLOW
    if (segment % 7 === 0) return 2; // RED
    if (segment % 11 === 0) return 3; // GREEN
    if (segment % 13 === 0) return 4; // PURPLE
    return 5; // NEUTRAL
}

function generateTraits(address) {
    const addrBytes = addressToBytes(address);

    const seg1 = bytesToUint32(addrBytes, 0);
    const hatStyle = seg1 % 10;
    const hatColor = getColorFamily(seg1);
    const hatOpacity = ((seg1 >> 8) % 156) + 100;

    const seg2 = bytesToUint32(addrBytes, 4);
    const clothesStyle = seg2 % 15;
    const clothesColor = getColorFamily(seg2);
    const clothesOpacity = ((seg2 >> 8) % 156) + 100;

    const seg3 = bytesToUint32(addrBytes, 8);
    const shoesStyle = seg3 % 8;
    const shoesColor = getColorFamily(seg3);
    const shoesOpacity = ((seg3 >> 8) % 156) + 100;

    const seg4 = bytesToUint32(addrBytes, 12);
    const pantsStyle = seg4 % 12;
    const pantsColor = getColorFamily(seg4);
    const pantsOpacity = ((seg4 >> 8) % 156) + 100;

    const seg5 = bytesToUint32(addrBytes, 16);
    const skinTone = seg5 % 6;
    const skinShade = (seg5 >> 8) % 50;

    return {
        hatStyle,
        hatColor,
        hatOpacity,
        clothesStyle,
        clothesColor,
        clothesOpacity,
        shoesStyle,
        shoesColor,
        shoesOpacity,
        pantsStyle,
        pantsColor,
        pantsOpacity,
        skinTone,
        skinShade,
    };
}

// 색상 이름
const COLOR_FAMILY_NAMES = {
    0: 'Blue',
    1: 'Yellow',
    2: 'Red',
    3: 'Green',
    4: 'Purple',
    5: 'Neutral',
};

// 스타일 이름
const HAT_STYLES = ['None', 'Cap', 'Beanie', 'Top Hat', 'Crown', 'Headband', 'Helmet', 'Bandana', 'Halo', 'Horns'];
const CLOTHES_STYLES = ['T-Shirt', 'Tank Top', 'Hoodie', 'Jacket', 'Suit', 'Armor', 'Cape', 'Robe', 'Jersey', 'Sweater', 'Vest', 'Coat', 'Kimono', 'Overalls', 'None'];
const SHOES_STYLES = ['Sneakers', 'Boots', 'Sandals', 'Dress Shoes', 'Slippers', 'High Heels', 'Combat Boots', 'Barefoot'];
const PANTS_STYLES = ['Jeans', 'Shorts', 'Skirt', 'Dress Pants', 'Sweatpants', 'Cargo Pants', 'Leggings', 'Suit Pants', 'Ripped Jeans', 'Khakis', 'Track Pants', 'None'];
const SKIN_TONES = ['Light', 'Fair', 'Medium', 'Tan', 'Dark', 'Deep'];

function getStyleName(category, styleIndex) {
    switch (category) {
        case 'hat': return HAT_STYLES[styleIndex] || 'Unknown';
        case 'clothes': return CLOTHES_STYLES[styleIndex] || 'Unknown';
        case 'shoes': return SHOES_STYLES[styleIndex] || 'Unknown';
        case 'pants': return PANTS_STYLES[styleIndex] || 'Unknown';
        case 'skin': return SKIN_TONES[styleIndex] || 'Unknown';
        default: return 'Unknown';
    }
}

// Trait → 프롬프트
function traitsToPrompt(traits) {
    const parts = [];

    if (traits.hatStyle !== 0) {
        const hatName = getStyleName('hat', traits.hatStyle);
        const hatColor = COLOR_FAMILY_NAMES[traits.hatColor];
        parts.push(`${hatColor} ${hatName}`);
    }

    if (traits.clothesStyle !== 14) {
        const clothesName = getStyleName('clothes', traits.clothesStyle);
        const clothesColor = COLOR_FAMILY_NAMES[traits.clothesColor];
        parts.push(`${clothesColor} ${clothesName}`);
    }

    if (traits.pantsStyle !== 11) {
        const pantsName = getStyleName('pants', traits.pantsStyle);
        const pantsColor = COLOR_FAMILY_NAMES[traits.pantsColor];
        parts.push(`${pantsColor} ${pantsName}`);
    }

    if (traits.shoesStyle !== 7) {
        const shoesName = getStyleName('shoes', traits.shoesStyle);
        const shoesColor = COLOR_FAMILY_NAMES[traits.shoesColor];
        parts.push(`${shoesColor} ${shoesName}`);
    }

    const skinToneName = getStyleName('skin', traits.skinTone);
    parts.push(`${skinToneName} skin tone`);

    return `Design a Minecraft character skin in classic pixel art style with the following features: ${parts.join(', ')}.
Use a pixelated, slightly patchy texture with color variations for authentic retro game aesthetics.
Add subtle shading and highlights using pixel-level dithering patterns.
Apply texture variation across all 6 faces (front, back, left, right, top, bottom) to create visual depth.
Ensure the pixel art design works well in 3D when wrapped around a Minecraft player model.`;
}

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

// AI 호출
async function generateColorScheme(prompt, apiKey) {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in AI response');
    }

    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    return JSON.parse(jsonText);
}

// UV 좌표
const UV_COORDS = {
    head: {
        top: { x: 8, y: 0, w: 8, h: 8 },
        bottom: { x: 16, y: 0, w: 8, h: 8 },
        front: { x: 8, y: 8, w: 8, h: 8 },
        back: { x: 24, y: 8, w: 8, h: 8 },
        right: { x: 0, y: 8, w: 8, h: 8 },
        left: { x: 16, y: 8, w: 8, h: 8 },
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

// 디더링을 위한 헬퍼 함수
function fillRectWithDithering(ctx, x, y, w, h, baseColor, darkColor, lightColor) {
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

// Canvas 렌더링 (픽셀 아트 스타일)
function renderSkinFromColorScheme(colorScheme) {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 64, 64);

    // 머리 - 디더링 적용
    const skinBase = colorScheme.head.skin;
    const skinDark = colorScheme.head.skinShadow || colorScheme.head.skin;
    const skinLight = colorScheme.head.skinHighlight || colorScheme.head.skin;

    Object.values(UV_COORDS.head).slice(0, 6).forEach((coord) => {
        fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, skinBase, skinDark, skinLight);
    });

    // 머리카락/모자 오버레이
    if (colorScheme.head.hair || colorScheme.accessories?.hat) {
        const hairBase = colorScheme.accessories?.hat || colorScheme.head.hair;
        const hairDark = colorScheme.accessories?.hatDetail || hairBase;
        const hairLight = colorScheme.head.hairHighlight || hairBase;

        Object.values(UV_COORDS.head).slice(6).forEach((coord) => {
            fillRectWithDithering(ctx, coord.x, coord.y, coord.w, coord.h, hairBase, hairDark, hairLight);
        });
    }

    // 눈
    if (colorScheme.head.eyes) {
        ctx.fillStyle = colorScheme.head.eyes;
        const headFront = UV_COORDS.head.front;
        ctx.fillRect(headFront.x + 2, headFront.y + 2, 2, 2);
        ctx.fillRect(headFront.x + 4, headFront.y + 2, 2, 2);
    }

    // 입
    if (colorScheme.head.mouth) {
        ctx.fillStyle = colorScheme.head.mouth;
        const headFront = UV_COORDS.head.front;
        ctx.fillRect(headFront.x + 2, headFront.y + 5, 4, 1);
    }

    // 몸통 - 디더링 적용
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

    // 팔 - 디더링 적용
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

    // 다리 베이스 레이어 - 디더링 적용
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

    return canvas.toBuffer('image/png');
}

// 메인 함수
async function main() {
    console.log('🎨 기본 주소의 AI 스킨 생성 시작...');
    console.log(`주소: ${DEFAULT_ADDRESS}\n`);

    // 1. Trait 생성
    const traits = generateTraits(DEFAULT_ADDRESS);
    console.log('✅ Traits 생성 완료:');
    console.log(JSON.stringify(traits, null, 2));
    console.log();

    // 2. 프롬프트 생성
    const prompt = traitsToPrompt(traits);
    console.log('✅ 프롬프트 생성:');
    console.log(prompt);
    console.log();

    // 3. API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
    }

    // 4. AI 색상 스킴 생성
    console.log('🤖 Claude AI 호출 중...');
    const colorScheme = await generateColorScheme(prompt, apiKey);
    console.log('✅ 색상 스킴 생성 완료:');
    console.log(JSON.stringify(colorScheme, null, 2));
    console.log();

    // 5. Canvas 렌더링
    console.log('🎨 64x64 텍스처 렌더링 중...');
    const pngBuffer = renderSkinFromColorScheme(colorScheme);

    // 6. 파일 저장
    const publicDir = join(__dirname, '..', 'public');
    const outputPath = join(publicDir, 'default-ai-skin.png');
    writeFileSync(outputPath, pngBuffer);
    console.log(`✅ 스킨 저장 완료: ${outputPath}`);
    console.log();

    // 7. Traits JSON도 저장
    const traitsOutputPath = join(publicDir, 'default-traits.json');
    writeFileSync(traitsOutputPath, JSON.stringify(traits, null, 2));
    console.log(`✅ Traits 저장 완료: ${traitsOutputPath}`);
    console.log();

    console.log('🎉 모든 작업 완료!');
}

main().catch((error) => {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
});

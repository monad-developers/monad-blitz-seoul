/**
 * Trait 스타일 이름 및 색상 팔레트 정의
 */

import { ColorFamily } from './traitGenerator';

// ========== Hat Styles ==========

export const HAT_STYLES = [
    'None',          // 0
    'Cap',           // 1
    'Beanie',        // 2
    'Top Hat',       // 3
    'Crown',         // 4
    'Headband',      // 5
    'Helmet',        // 6
    'Bandana',       // 7
    'Halo',          // 8
    'Horns',         // 9
] as const;

// ========== Clothes Styles ==========

export const CLOTHES_STYLES = [
    'T-Shirt',       // 0
    'Tank Top',      // 1
    'Hoodie',        // 2
    'Jacket',        // 3
    'Suit',          // 4
    'Armor',         // 5
    'Cape',          // 6
    'Robe',          // 7
    'Jersey',        // 8
    'Sweater',       // 9
    'Vest',          // 10
    'Coat',          // 11
    'Kimono',        // 12
    'Overalls',      // 13
    'None',          // 14
] as const;

// ========== Shoes Styles ==========

export const SHOES_STYLES = [
    'Sneakers',      // 0
    'Boots',         // 1
    'Sandals',       // 2
    'Dress Shoes',   // 3
    'Slippers',      // 4
    'High Heels',    // 5
    'Combat Boots',  // 6
    'Barefoot',      // 7
] as const;

// ========== Pants Styles ==========

export const PANTS_STYLES = [
    'Jeans',         // 0
    'Shorts',        // 1
    'Skirt',         // 2
    'Dress Pants',   // 3
    'Sweatpants',    // 4
    'Cargo Pants',   // 5
    'Leggings',      // 6
    'Suit Pants',    // 7
    'Ripped Jeans',  // 8
    'Khakis',        // 9
    'Track Pants',   // 10
    'None',          // 11
] as const;

// ========== Skin Tones ==========

export const SKIN_TONES = [
    'Light',         // 0
    'Fair',          // 1
    'Medium',        // 2
    'Tan',           // 3
    'Dark',          // 4
    'Deep',          // 5
] as const;

// ========== Color Palettes ==========

export interface ColorPalette {
    base: string;
    light: string;
    dark: string;
}

export const COLOR_PALETTES: Record<ColorFamily, ColorPalette[]> = {
    [ColorFamily.BLUE]: [
        { base: '#1E3A8A', light: '#3B82F6', dark: '#1E40AF' },
        { base: '#0EA5E9', light: '#38BDF8', dark: '#0284C7' },
        { base: '#06B6D4', light: '#22D3EE', dark: '#0891B2' },
    ],
    [ColorFamily.YELLOW]: [
        { base: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
        { base: '#EAB308', light: '#FDE047', dark: '#CA8A04' },
        { base: '#FBBF24', light: '#FDE68A', dark: '#F59E0B' },
    ],
    [ColorFamily.RED]: [
        { base: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
        { base: '#F97316', light: '#FB923C', dark: '#EA580C' },
        { base: '#EF4444', light: '#F87171', dark: '#DC2626' },
    ],
    [ColorFamily.GREEN]: [
        { base: '#16A34A', light: '#22C55E', dark: '#15803D' },
        { base: '#059669', light: '#10B981', dark: '#047857' },
        { base: '#65A30D', light: '#84CC16', dark: '#4D7C0F' },
    ],
    [ColorFamily.PURPLE]: [
        { base: '#9333EA', light: '#A855F7', dark: '#7E22CE' },
        { base: '#7C3AED', light: '#8B5CF6', dark: '#6D28D9' },
        { base: '#A855F7', light: '#C084FC', dark: '#9333EA' },
    ],
    [ColorFamily.NEUTRAL]: [
        { base: '#6B7280', light: '#9CA3AF', dark: '#4B5563' },
        { base: '#78716C', light: '#A8A29E', dark: '#57534E' },
        { base: '#71717A', light: '#A1A1AA', dark: '#52525B' },
    ],
};

/**
 * 색상 계열과 투명도로부터 실제 색상 선택
 */
export function getColorFromFamily(
    colorFamily: ColorFamily,
    opacity: number,
    seed: number = 0
): ColorPalette {
    const palettes = COLOR_PALETTES[colorFamily];
    const index = seed % palettes.length;
    return palettes[index];
}

/**
 * 스타일 이름 가져오기
 */
export function getStyleName(
    category: 'hat' | 'clothes' | 'shoes' | 'pants' | 'skin',
    styleIndex: number
): string {
    switch (category) {
        case 'hat':
            return HAT_STYLES[styleIndex] || 'Unknown';
        case 'clothes':
            return CLOTHES_STYLES[styleIndex] || 'Unknown';
        case 'shoes':
            return SHOES_STYLES[styleIndex] || 'Unknown';
        case 'pants':
            return PANTS_STYLES[styleIndex] || 'Unknown';
        case 'skin':
            return SKIN_TONES[styleIndex] || 'Unknown';
        default:
            return 'Unknown';
    }
}

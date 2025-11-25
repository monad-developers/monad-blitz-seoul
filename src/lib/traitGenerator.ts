/**
 * TraitGenerator - TypeScript Implementation
 *
 * Solidity 버전과 정확히 동일한 로직으로 deterministic trait 생성
 * 동일한 주소는 항상 동일한 속성을 생성해야 함
 */

export interface SkinTraits {
    // Hat
    hatStyle: number;      // 0-9
    hatColor: number;      // 0-5
    hatOpacity: number;    // 100-255

    // Clothes
    clothesStyle: number;  // 0-14
    clothesColor: number;  // 0-5
    clothesOpacity: number; // 100-255

    // Shoes
    shoesStyle: number;    // 0-7
    shoesColor: number;    // 0-5
    shoesOpacity: number;  // 100-255

    // Pants
    pantsStyle: number;    // 0-11
    pantsColor: number;    // 0-5
    pantsOpacity: number;  // 100-255

    // Skin
    skinTone: number;      // 0-5
    skinShade: number;     // 0-49
}

/**
 * 색상 계열 enum
 */
export enum ColorFamily {
    BLUE = 0,
    YELLOW = 1,
    RED = 2,
    GREEN = 3,
    PURPLE = 4,
    NEUTRAL = 5,
}

/**
 * 색상 계열 이름 매핑
 */
export const COLOR_FAMILY_NAMES: Record<ColorFamily, string> = {
    [ColorFamily.BLUE]: 'Blue',
    [ColorFamily.YELLOW]: 'Yellow',
    [ColorFamily.RED]: 'Red',
    [ColorFamily.GREEN]: 'Green',
    [ColorFamily.PURPLE]: 'Purple',
    [ColorFamily.NEUTRAL]: 'Neutral',
};

/**
 * Ethereum 주소를 bytes로 변환 (0x 제거)
 */
function addressToBytes(address: string): Uint8Array {
    const hex = address.toLowerCase().startsWith('0x') ? address.slice(2) : address;
    const bytes = new Uint8Array(20);

    for (let i = 0; i < 20; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    return bytes;
}

/**
 * 4 bytes를 uint32로 변환
 */
function bytesToUint32(bytes: Uint8Array, offset: number): number {
    return (
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3]
    ) >>> 0; // unsigned
}

/**
 * 색상 계열 결정 (Solidity getColorFamily와 동일)
 *
 * 우선순위:
 * - 3의 배수 → Blue
 * - 5의 배수 → Yellow
 * - 7의 배수 → Red
 * - 11의 배수 → Green
 * - 13의 배수 → Purple
 * - 기타 → Neutral
 */
export function getColorFamily(segment: number): ColorFamily {
    if (segment % 3 === 0) return ColorFamily.BLUE;
    if (segment % 5 === 0) return ColorFamily.YELLOW;
    if (segment % 7 === 0) return ColorFamily.RED;
    if (segment % 11 === 0) return ColorFamily.GREEN;
    if (segment % 13 === 0) return ColorFamily.PURPLE;
    return ColorFamily.NEUTRAL;
}

/**
 * Ethereum 주소로부터 deterministic trait 생성
 *
 * @param address Ethereum 주소 (0x...)
 * @returns SkinTraits 객체
 *
 * Address 구조 (20 bytes):
 * - Bytes 0-3   (4 bytes) → 모자 (Hat)
 * - Bytes 4-7   (4 bytes) → 옷 (Clothes)
 * - Bytes 8-11  (4 bytes) → 신발 (Shoes)
 * - Bytes 12-15 (4 bytes) → 바지 (Pants)
 * - Bytes 16-19 (4 bytes) → 피부 (Skin)
 */
export function generateTraits(address: string): SkinTraits {
    const addrBytes = addressToBytes(address);

    // Segment 1: 모자 (Bytes 0-3)
    const seg1 = bytesToUint32(addrBytes, 0);
    const hatStyle = seg1 % 10;
    const hatColor = getColorFamily(seg1);
    const hatOpacity = ((seg1 >> 8) % 156) + 100;

    // Segment 2: 옷 (Bytes 4-7)
    const seg2 = bytesToUint32(addrBytes, 4);
    const clothesStyle = seg2 % 15;
    const clothesColor = getColorFamily(seg2);
    const clothesOpacity = ((seg2 >> 8) % 156) + 100;

    // Segment 3: 신발 (Bytes 8-11)
    const seg3 = bytesToUint32(addrBytes, 8);
    const shoesStyle = seg3 % 8;
    const shoesColor = getColorFamily(seg3);
    const shoesOpacity = ((seg3 >> 8) % 156) + 100;

    // Segment 4: 바지 (Bytes 12-15)
    const seg4 = bytesToUint32(addrBytes, 12);
    const pantsStyle = seg4 % 12;
    const pantsColor = getColorFamily(seg4);
    const pantsOpacity = ((seg4 >> 8) % 156) + 100;

    // Segment 5: 피부 (Bytes 16-19)
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

/**
 * Trait 검증 함수
 */
export function validateTraits(traits: SkinTraits): boolean {
    return (
        traits.hatStyle >= 0 && traits.hatStyle <= 9 &&
        traits.hatColor >= 0 && traits.hatColor <= 5 &&
        traits.hatOpacity >= 100 && traits.hatOpacity <= 255 &&

        traits.clothesStyle >= 0 && traits.clothesStyle <= 14 &&
        traits.clothesColor >= 0 && traits.clothesColor <= 5 &&
        traits.clothesOpacity >= 100 && traits.clothesOpacity <= 255 &&

        traits.shoesStyle >= 0 && traits.shoesStyle <= 7 &&
        traits.shoesColor >= 0 && traits.shoesColor <= 5 &&
        traits.shoesOpacity >= 100 && traits.shoesOpacity <= 255 &&

        traits.pantsStyle >= 0 && traits.pantsStyle <= 11 &&
        traits.pantsColor >= 0 && traits.pantsColor <= 5 &&
        traits.pantsOpacity >= 100 && traits.pantsOpacity <= 255 &&

        traits.skinTone >= 0 && traits.skinTone <= 5 &&
        traits.skinShade >= 0 && traits.skinShade <= 49
    );
}

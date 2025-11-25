// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TraitGenerator
 * @dev Address 기반 deterministic trait 생성 라이브러리
 *
 * 이 라이브러리는 이더리움 주소를 5개의 세그먼트로 나누어 각 세그먼트에서
 * 결정론적으로 NFT의 속성(Traits)을 생성합니다.
 *
 * Address 구조 (20 bytes):
 * - Bytes 0-3   (4 bytes) → 모자 (Hat)
 * - Bytes 4-7   (4 bytes) → 옷 (Clothes)
 * - Bytes 8-11  (4 bytes) → 신발 (Shoes)
 * - Bytes 12-15 (4 bytes) → 바지 (Pants)
 * - Bytes 16-19 (4 bytes) → 피부 (Skin)
 */
library TraitGenerator {
    /**
     * @dev NFT 스킨의 모든 속성을 담는 구조체
     */
    struct SkinTraits {
        // 모자
        uint8 hatStyle;       // 모자 스타일 (0-9)
        uint8 hatColor;       // 모자 색상 계열 (0-5)
        uint8 hatOpacity;     // 투명도 (100-255)

        // 옷
        uint8 clothesStyle;   // 옷 스타일 (0-14)
        uint8 clothesColor;   // 옷 색상 계열 (0-5)
        uint8 clothesOpacity; // 투명도 (100-255)

        // 신발
        uint8 shoesStyle;     // 신발 스타일 (0-7)
        uint8 shoesColor;     // 신발 색상 계열 (0-5)
        uint8 shoesOpacity;   // 투명도 (100-255)

        // 바지
        uint8 pantsStyle;     // 바지 스타일 (0-11)
        uint8 pantsColor;     // 바지 색상 계열 (0-5)
        uint8 pantsOpacity;   // 투명도 (100-255)

        // 피부
        uint8 skinTone;       // 피부톤 (0-5)
        uint8 skinShade;      // 피부 명암 (0-49)
    }

    /**
     * @dev 주소로부터 모든 속성을 결정론적으로 생성
     * @param owner NFT 소유자 주소
     * @return traits 생성된 스킨 속성
     */
    function generateTraits(address owner) internal pure returns (SkinTraits memory) {
        bytes20 addrBytes = bytes20(owner);
        SkinTraits memory traits;

        // Segment 1: 모자 (Bytes 0-3)
        uint32 seg1 = uint32(bytes4(addrBytes));
        traits.hatStyle = uint8(seg1 % 10);
        traits.hatColor = getColorFamily(seg1);
        traits.hatOpacity = uint8((seg1 >> 8) % 156) + 100;

        // Segment 2: 옷 (Bytes 4-7)
        uint32 seg2 = uint32(bytes4(addrBytes << 32));
        traits.clothesStyle = uint8(seg2 % 15);
        traits.clothesColor = getColorFamily(seg2);
        traits.clothesOpacity = uint8((seg2 >> 8) % 156) + 100;

        // Segment 3: 신발 (Bytes 8-11)
        uint32 seg3 = uint32(bytes4(addrBytes << 64));
        traits.shoesStyle = uint8(seg3 % 8);
        traits.shoesColor = getColorFamily(seg3);
        traits.shoesOpacity = uint8((seg3 >> 8) % 156) + 100;

        // Segment 4: 바지 (Bytes 12-15)
        uint32 seg4 = uint32(bytes4(addrBytes << 96));
        traits.pantsStyle = uint8(seg4 % 12);
        traits.pantsColor = getColorFamily(seg4);
        traits.pantsOpacity = uint8((seg4 >> 8) % 156) + 100;

        // Segment 5: 피부 (Bytes 16-19)
        uint32 seg5 = uint32(bytes4(addrBytes << 128));
        traits.skinTone = uint8(seg5 % 6);
        traits.skinShade = uint8((seg5 >> 8) % 50);

        return traits;
    }

    /**
     * @dev 세그먼트 값으로부터 색상 계열 결정
     * @param segment 4바이트 세그먼트 값
     * @return 색상 계열 (0: Blue, 1: Yellow, 2: Red, 3: Green, 4: Purple, 5: Neutral)
     *
     * 우선순위가 있는 나눗셈 체크:
     * - 3의 배수 → Blue
     * - 5의 배수 → Yellow
     * - 7의 배수 → Red
     * - 11의 배수 → Green
     * - 13의 배수 → Purple
     * - 기타 → Neutral
     */
    function getColorFamily(uint32 segment) internal pure returns (uint8) {
        if (segment % 3 == 0) return 0;  // Blue
        if (segment % 5 == 0) return 1;  // Yellow
        if (segment % 7 == 0) return 2;  // Red
        if (segment % 11 == 0) return 3; // Green
        if (segment % 13 == 0) return 4; // Purple
        return 5;                         // Neutral
    }
}

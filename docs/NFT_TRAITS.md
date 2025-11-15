# NFT 속성 생성 메커니즘

## 🎨 Address 기반 Deterministic Traits

### 1. ETH Address 구조

**ETH Address 구조**:
```
0x + 40 hex characters = 42 characters total
실제 데이터: 20 bytes
```

**Segmentation 전략**:
```
Bytes 0-3   (4 bytes) → 모자 (Hat)
Bytes 4-7   (4 bytes) → 옷 (Clothes)
Bytes 8-11  (4 bytes) → 신발 (Shoes)
Bytes 12-15 (4 bytes) → 바지 (Pants)
Bytes 16-19 (4 bytes) → 피부 (Skin)
```

---

## 📊 Trait 구조

```solidity
struct SkinTraits {
    // 기본 외형 속성 (address 기반)
    uint8 hatStyle;       // 모자 스타일 (0-9)
    uint8 hatColor;       // 모자 색상 계열 (0-5)
    uint8 hatOpacity;     // 투명도 (100-255)

    uint8 clothesStyle;   // 옷 스타일 (0-14)
    uint8 clothesColor;   // 옷 색상 계열
    uint8 clothesOpacity; // 투명도

    uint8 shoesStyle;     // 신발 스타일 (0-7)
    uint8 shoesColor;     // 신발 색상 계열
    uint8 shoesOpacity;   // 투명도

    uint8 pantsStyle;     // 바지 스타일 (0-11)
    uint8 pantsColor;     // 바지 색상 계열
    uint8 pantsOpacity;   // 투명도

    uint8 skinTone;       // 피부톤 (0-5)
    uint8 skinShade;      // 피부 명암 (0-49)

    // Wealth 기반 속성
    uint8 wealthTier;     // 자산 등급 (0-5)
    uint8 specialItem;    // 특별 아이템 ID (0-19)
}
```

---

## 🎨 색상 계열 시스템

### 6가지 색상 계열

```javascript
0: BLUE    - 파란색 계열 (3의 배수)
1: YELLOW  - 노란색 계열 (5의 배수)
2: RED     - 빨간색 계열 (7의 배수)
3: GREEN   - 초록색 계열 (11의 배수)
4: PURPLE  - 보라색 계열 (13의 배수)
5: NEUTRAL - 중립 색상 계열 (기타)
```

### 각 계열별 세부 팔레트

```typescript
const COLOR_PALETTES = {
  BLUE: [
    { base: '#1E3A8A', light: '#3B82F6', dark: '#1E40AF' },
    { base: '#0EA5E9', light: '#38BDF8', dark: '#0284C7' },
    { base: '#06B6D4', light: '#22D3EE', dark: '#0891B2' },
  ],
  YELLOW: [
    { base: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
    { base: '#EAB308', light: '#FDE047', dark: '#CA8A04' },
    { base: '#FBBF24', light: '#FDE68A', dark: '#F59E0B' },
  ],
  RED: [
    { base: '#DC2626', light: '#EF4444', dark: '#B91C1C' },
    { base: '#F97316', light: '#FB923C', dark: '#EA580C' },
    { base: '#EF4444', light: '#F87171', dark: '#DC2626' },
  ],
  GREEN: [
    { base: '#16A34A', light: '#22C55E', dark: '#15803D' },
    { base: '#059669', light: '#10B981', dark: '#047857' },
    { base: '#65A30D', light: '#84CC16', dark: '#4D7C0F' },
  ],
  PURPLE: [
    { base: '#9333EA', light: '#A855F7', dark: '#7E22CE' },
    { base: '#7C3AED', light: '#8B5CF6', dark: '#6D28D9' },
    { base: '#A855F7', light: '#C084FC', dark: '#9333EA' },
  ],
  NEUTRAL: [
    { base: '#6B7280', light: '#9CA3AF', dark: '#4B5563' },
    { base: '#78716C', light: '#A8A29E', dark: '#57534E' },
    { base: '#71717A', light: '#A1A1AA', dark: '#52525B' },
  ],
};
```

---

## 🔧 Trait 생성 알고리즘

### Solidity 구현

```solidity
function generateTraits(address owner) internal pure returns (SkinTraits memory) {
    bytes20 addrBytes = bytes20(owner);
    SkinTraits memory traits;

    // Segment 1: 모자
    uint32 seg1 = uint32(bytes4(addrBytes));
    traits.hatStyle = uint8(seg1 % 10);
    traits.hatColor = getColorFamily(seg1);
    traits.hatOpacity = uint8((seg1 >> 8) % 156) + 100;

    // Segment 2: 옷
    uint32 seg2 = uint32(bytes4(addrBytes << 32));
    traits.clothesStyle = uint8(seg2 % 15);
    traits.clothesColor = getColorFamily(seg2);
    traits.clothesOpacity = uint8((seg2 >> 8) % 156) + 100;

    // Segment 3: 신발
    uint32 seg3 = uint32(bytes4(addrBytes << 64));
    traits.shoesStyle = uint8(seg3 % 8);
    traits.shoesColor = getColorFamily(seg3);
    traits.shoesOpacity = uint8((seg3 >> 8) % 156) + 100;

    // Segment 4: 바지
    uint32 seg4 = uint32(bytes4(addrBytes << 96));
    traits.pantsStyle = uint8(seg4 % 12);
    traits.pantsColor = getColorFamily(seg4);
    traits.pantsOpacity = uint8((seg4 >> 8) % 156) + 100;

    // Segment 5: 피부
    uint32 seg5 = uint32(bytes4(addrBytes << 128));
    traits.skinTone = uint8(seg5 % 6);
    traits.skinShade = uint8((seg5 >> 8) % 50);

    return traits;
}

function getColorFamily(uint32 segment) internal pure returns (uint8) {
    if (segment % 3 == 0) return 0;  // Blue
    if (segment % 5 == 0) return 1;  // Yellow
    if (segment % 7 == 0) return 2;  // Red
    if (segment % 11 == 0) return 3; // Green
    if (segment % 13 == 0) return 4; // Purple
    return 5;                         // Neutral
}
```

### Segment 내 랜덤성 구현

```solidity
uint32 segment = uint32(bytes4(addrBytes));
uint8 style = uint8(segment % maxStyles);          // 스타일 선택
uint8 colorFamily = getColorFamily(segment);        // 색상 계열
uint8 opacity = uint8((segment >> 8) % 156) + 100;  // 100-255 투명도
```

---

## 🎯 스타일 옵션

### Hat Styles (0-9)
```
0: None (모자 없음)
1: Cap (야구 모자)
2: Beanie (비니)
3: Top Hat (실크 해트)
4: Crown (왕관)
5: Headband (머리띠)
6: Helmet (헬멧)
7: Bandana (두건)
8: Halo (후광)
9: Horns (뿔)
```

### Clothes Styles (0-14)
```
0: T-Shirt (티셔츠)
1: Tank Top (민소매)
2: Hoodie (후드티)
3: Jacket (재킷)
4: Suit (정장)
5: Armor (갑옷)
6: Cape (망토)
7: Robe (로브)
8: Jersey (운동복)
9: Sweater (스웨터)
10: Vest (조끼)
11: Coat (코트)
12: Kimono (기모노)
13: Overalls (멜빵바지)
14: None (상의 없음)
```

### Shoes Styles (0-7)
```
0: Sneakers (운동화)
1: Boots (부츠)
2: Sandals (샌들)
3: Dress Shoes (구두)
4: Slippers (슬리퍼)
5: High Heels (하이힐)
6: Combat Boots (전투화)
7: Barefoot (맨발)
```

### Pants Styles (0-11)
```
0: Jeans (청바지)
1: Shorts (반바지)
2: Skirt (치마)
3: Dress Pants (정장 바지)
4: Sweatpants (트레이닝 바지)
5: Cargo Pants (카고 바지)
6: Leggings (레깅스)
7: Suit Pants (정장 바지)
8: Ripped Jeans (찢어진 청바지)
9: Khakis (카키 바지)
10: Track Pants (트랙 바지)
11: None (하의 없음)
```

### Skin Tones (0-5)
```
0: Light (밝은 피부)
1: Fair (하얀 피부)
2: Medium (보통 피부)
3: Tan (태닝된 피부)
4: Dark (어두운 피부)
5: Deep (짙은 피부)
```

---

## 🧪 예제

### 예제 1: 주소 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbC

```
Segment 1 (모자): 0x742d35Cc = 1949746636
  - hatStyle = 1949746636 % 10 = 6 (Helmet)
  - hatColor = getColorFamily(1949746636) = 0 (Blue)
  - hatOpacity = (1949746636 >> 8) % 156 + 100 = 212

Segment 2 (옷): 0x6634C053 = 1714679891
  - clothesStyle = 1714679891 % 15 = 6 (Cape)
  - clothesColor = getColorFamily(1714679891) = 0 (Blue)
  - clothesOpacity = (1714679891 >> 8) % 156 + 100 = 163

...
```

---

## 🔍 Deterministic 속성

### 장점
1. **재현 가능성**: 동일한 주소는 항상 동일한 속성 생성
2. **온체인 검증**: 누구나 주소만으로 속성 검증 가능
3. **가스 효율**: 랜덤 생성보다 가스비 절감
4. **투명성**: 모든 로직이 공개되어 검증 가능

### 특성
- 주소 변경 불가 → NFT 속성 변경 불가
- 민팅 전 미리보기 가능
- 오프체인에서 계산 가능 (view 함수)

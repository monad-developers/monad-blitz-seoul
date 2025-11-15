# NFT 메타데이터 스키마

## 📄 OpenSea 메타데이터 표준

### 전체 스키마

```json
{
  "name": "Minecraft PFP #1234",
  "description": "Dynamic Minecraft-style PFP NFT with wealth-based traits. Generated deterministically from wallet address with special items based on portfolio value at mint time.",
  "image": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "animation_url": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "attributes": [
    {
      "trait_type": "Hat Style",
      "value": 5
    },
    {
      "trait_type": "Hat Color",
      "value": "Blue"
    },
    {
      "trait_type": "Hat Opacity",
      "value": 200
    },
    {
      "trait_type": "Clothes Style",
      "value": 8
    },
    {
      "trait_type": "Clothes Color",
      "value": "Red"
    },
    {
      "trait_type": "Clothes Opacity",
      "value": 180
    },
    {
      "trait_type": "Shoes Style",
      "value": 3
    },
    {
      "trait_type": "Shoes Color",
      "value": "Yellow"
    },
    {
      "trait_type": "Shoes Opacity",
      "value": 220
    },
    {
      "trait_type": "Pants Style",
      "value": 7
    },
    {
      "trait_type": "Pants Color",
      "value": "Green"
    },
    {
      "trait_type": "Pants Opacity",
      "value": 190
    },
    {
      "trait_type": "Skin Tone",
      "value": 2
    },
    {
      "trait_type": "Skin Shade",
      "value": 25
    },
    {
      "trait_type": "Wealth Tier",
      "value": "Gold",
      "display_type": "string"
    },
    {
      "trait_type": "Total Wealth (USD)",
      "value": 75000,
      "display_type": "number"
    },
    {
      "trait_type": "ETH Value (USD)",
      "value": 50000,
      "display_type": "number"
    },
    {
      "trait_type": "USDT Value (USD)",
      "value": 15000,
      "display_type": "number"
    },
    {
      "trait_type": "USDC Value (USD)",
      "value": 10000,
      "display_type": "number"
    },
    {
      "trait_type": "Special Item",
      "value": "Golden Sword"
    },
    {
      "trait_type": "Mint Timestamp",
      "value": 1699564800,
      "display_type": "date"
    }
  ],
  "properties": {
    "category": "pfp",
    "files": [
      {
        "uri": "ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "type": "image/gif"
      }
    ],
    "creators": [
      {
        "address": "0xYourContractAddress",
        "share": 100
      }
    ]
  }
}
```

---

## 🏷️ 필드 설명

### 기본 정보

#### name
- **타입**: `string`
- **필수**: ✅
- **설명**: NFT의 이름
- **형식**: `"Minecraft PFP #[tokenId]"`
- **예시**: `"Minecraft PFP #1234"`

#### description
- **타입**: `string`
- **필수**: ✅
- **설명**: NFT에 대한 설명
- **권장**: 프로젝트 핵심 컨셉 포함

#### image
- **타입**: `string` (URI)
- **필수**: ✅
- **설명**: 정적 이미지 URI (썸네일)
- **형식**: `ipfs://[CID]`
- **권장**: 512x512 또는 1024x1024 PNG

#### animation_url
- **타입**: `string` (URI)
- **필수**: ❌
- **설명**: 애니메이션 파일 URI
- **형식**: `ipfs://[CID]`
- **지원**: GIF, MP4, HTML

---

## 📊 Attributes 구조

### 기본 Trait 속성

#### Hat (모자)
```json
{
  "trait_type": "Hat Style",
  "value": 5
},
{
  "trait_type": "Hat Color",
  "value": "Blue"
},
{
  "trait_type": "Hat Opacity",
  "value": 200
}
```

**Style 값 범위**: 0-9
**Color 값**: "Blue", "Yellow", "Red", "Green", "Purple", "Neutral"
**Opacity 값 범위**: 100-255

#### Clothes (옷)
```json
{
  "trait_type": "Clothes Style",
  "value": 8
},
{
  "trait_type": "Clothes Color",
  "value": "Red"
},
{
  "trait_type": "Clothes Opacity",
  "value": 180
}
```

**Style 값 범위**: 0-14

#### Shoes (신발)
```json
{
  "trait_type": "Shoes Style",
  "value": 3
},
{
  "trait_type": "Shoes Color",
  "value": "Yellow"
},
{
  "trait_type": "Shoes Opacity",
  "value": 220
}
```

**Style 값 범위**: 0-7

#### Pants (바지)
```json
{
  "trait_type": "Pants Style",
  "value": 7
},
{
  "trait_type": "Pants Color",
  "value": "Green"
},
{
  "trait_type": "Pants Opacity",
  "value": 190
}
```

**Style 값 범위**: 0-11

#### Skin (피부)
```json
{
  "trait_type": "Skin Tone",
  "value": 2
},
{
  "trait_type": "Skin Shade",
  "value": 25
}
```

**Tone 값 범위**: 0-5
**Shade 값 범위**: 0-49

---

### Wealth 기반 속성

#### Wealth Tier
```json
{
  "trait_type": "Wealth Tier",
  "value": "Gold",
  "display_type": "string"
}
```

**가능한 값**:
- "None" (Tier 0)
- "Bronze" (Tier 1)
- "Silver" (Tier 2)
- "Gold" (Tier 3)
- "Platinum" (Tier 4)
- "Diamond" (Tier 5)

#### Total Wealth
```json
{
  "trait_type": "Total Wealth (USD)",
  "value": 75000,
  "display_type": "number"
}
```

**display_type**: `"number"` (숫자 필터링 지원)

#### Asset Breakdown
```json
{
  "trait_type": "ETH Value (USD)",
  "value": 50000,
  "display_type": "number"
},
{
  "trait_type": "USDT Value (USD)",
  "value": 15000,
  "display_type": "number"
},
{
  "trait_type": "USDC Value (USD)",
  "value": 10000,
  "display_type": "number"
}
```

#### Special Item
```json
{
  "trait_type": "Special Item",
  "value": "Golden Sword"
}
```

**가능한 값**: 아이템 이름 (문자열)

---

### 타임스탬프

```json
{
  "trait_type": "Mint Timestamp",
  "value": 1699564800,
  "display_type": "date"
}
```

**value**: Unix timestamp (초 단위)
**display_type**: `"date"` (날짜 형식으로 표시)

---

## 🎯 Properties 섹션

### category
- **타입**: `string`
- **값**: `"pfp"`
- **설명**: NFT 카테고리 지정

### files
- **타입**: `array`
- **설명**: 관련 파일 목록

```json
"files": [
  {
    "uri": "ipfs://QmXXX...",
    "type": "image/gif"
  }
]
```

### creators
- **타입**: `array`
- **설명**: 제작자 정보

```json
"creators": [
  {
    "address": "0xYourContractAddress",
    "share": 100
  }
]
```

---

## 🔍 Display Types

OpenSea는 다음 display_type을 지원합니다:

### number
- 숫자 범위 필터링 지원
- 통계 표시

```json
{
  "trait_type": "Total Wealth (USD)",
  "value": 75000,
  "display_type": "number"
}
```

### boost_number
- 퍼센트 또는 배수 부스트
- 게임 스탯에 유용

```json
{
  "trait_type": "Power Level",
  "value": 150,
  "display_type": "boost_number"
}
```

### boost_percentage
- 퍼센트 부스트
- 자동으로 % 기호 추가

```json
{
  "trait_type": "Speed Boost",
  "value": 10,
  "display_type": "boost_percentage"
}
```

### date
- 날짜/시간 표시
- Unix timestamp 사용

```json
{
  "trait_type": "Mint Timestamp",
  "value": 1699564800,
  "display_type": "date"
}
```

---

## 📝 TypeScript 인터페이스

```typescript
interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    animation_url?: string;
    attributes: Attribute[];
    properties?: {
        category?: string;
        files?: File[];
        creators?: Creator[];
    };
}

interface Attribute {
    trait_type: string;
    value: string | number;
    display_type?: 'string' | 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

interface File {
    uri: string;
    type: string;
}

interface Creator {
    address: string;
    share: number;
}
```

---

## 🛠️ 메타데이터 생성 함수

```typescript
function generateMetadata(
    tokenId: number,
    traits: SkinTraits,
    wealthTier: number,
    specialItem: number,
    totalWealthUSD: number,
    ethValueUSD: number,
    usdtValueUSD: number,
    usdcValueUSD: number,
    gifCID: string,
    mintTimestamp: number
): NFTMetadata {
    const tierNames = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const colorNames = ['Blue', 'Yellow', 'Red', 'Green', 'Purple', 'Neutral'];

    return {
        name: `Minecraft PFP #${tokenId}`,
        description:
            'Dynamic Minecraft-style PFP NFT with wealth-based traits. Generated deterministically from wallet address with special items based on portfolio value at mint time.',
        image: `ipfs://${gifCID}`,
        animation_url: `ipfs://${gifCID}`,
        attributes: [
            // Hat
            { trait_type: 'Hat Style', value: traits.hatStyle },
            { trait_type: 'Hat Color', value: colorNames[traits.hatColor] },
            { trait_type: 'Hat Opacity', value: traits.hatOpacity },

            // Clothes
            { trait_type: 'Clothes Style', value: traits.clothesStyle },
            { trait_type: 'Clothes Color', value: colorNames[traits.clothesColor] },
            { trait_type: 'Clothes Opacity', value: traits.clothesOpacity },

            // Shoes
            { trait_type: 'Shoes Style', value: traits.shoesStyle },
            { trait_type: 'Shoes Color', value: colorNames[traits.shoesColor] },
            { trait_type: 'Shoes Opacity', value: traits.shoesOpacity },

            // Pants
            { trait_type: 'Pants Style', value: traits.pantsStyle },
            { trait_type: 'Pants Color', value: colorNames[traits.pantsColor] },
            { trait_type: 'Pants Opacity', value: traits.pantsOpacity },

            // Skin
            { trait_type: 'Skin Tone', value: traits.skinTone },
            { trait_type: 'Skin Shade', value: traits.skinShade },

            // Wealth
            {
                trait_type: 'Wealth Tier',
                value: tierNames[wealthTier],
                display_type: 'string',
            },
            {
                trait_type: 'Total Wealth (USD)',
                value: totalWealthUSD,
                display_type: 'number',
            },
            {
                trait_type: 'ETH Value (USD)',
                value: ethValueUSD,
                display_type: 'number',
            },
            {
                trait_type: 'USDT Value (USD)',
                value: usdtValueUSD,
                display_type: 'number',
            },
            {
                trait_type: 'USDC Value (USD)',
                value: usdcValueUSD,
                display_type: 'number',
            },

            // Special Item
            { trait_type: 'Special Item', value: getItemName(specialItem) },

            // Timestamp
            {
                trait_type: 'Mint Timestamp',
                value: mintTimestamp,
                display_type: 'date',
            },
        ],
        properties: {
            category: 'pfp',
            files: [
                {
                    uri: `ipfs://${gifCID}`,
                    type: 'image/gif',
                },
            ],
            creators: [
                {
                    address: process.env.CONTRACT_ADDRESS,
                    share: 100,
                },
            ],
        },
    };
}
```

---

## ✅ 검증

### 메타데이터 검증 체크리스트

- [ ] `name` 필드 존재
- [ ] `description` 필드 존재
- [ ] `image` 필드 존재 및 유효한 URI
- [ ] `attributes` 배열 존재
- [ ] 각 attribute에 `trait_type`, `value` 존재
- [ ] `display_type` 값이 유효 (선택사항)
- [ ] IPFS CID가 유효
- [ ] JSON 형식이 올바름

### 온라인 검증 도구
- OpenSea Metadata Standards: https://docs.opensea.io/docs/metadata-standards
- JSON Schema Validator: https://www.jsonschemavalidator.net/

# Monad Penguins NFT 컬렉션 구현 계획서

**작성일**: 2025-01-15
**프로젝트**: Monad Penguins - Ethereum Sepolia NFT Collection
**목적**: Sepolia에서 Monad Penguins NFT를 발행하고, 소유자가 Monad Testnet에서 특수 trait을 받을 수 있는 크로스체인 시스템 구축

---

## 📖 프로젝트 컨셉

### 스토리: 길을 잃은 모나드 펭귄들

> 모나드 체인의 극지방에 살던 펭귄들이 크로스체인 포털의 오작동으로 이더리움 세폴리아로 이동하게 되었습니다. 이 펭귄들을 구출하고 모나드로 다시 데려오는 사람들에게는 특별한 보상이 주어집니다!

**내러티브**:
- Monad Penguins는 Ethereum Sepolia에 갇혀있는 펭귄 NFT 컬렉션
- 이 펭귄들을 소유한 사람들은 "구출자" 자격을 증명
- Monad Testnet에서 Minecraft PFP를 민팅할 때, CCIP를 통해 구출자 자격을 검증받음
- 검증된 구출자에게는 **특수 펭귄 trait** (얼음 왕관, 펭귄 친구, 눈꽃 이펙트 등)이 부여됨

---

## 🏗️ 시스템 아키텍처

```
[Ethereum Sepolia]
├─ MonadPenguins.sol (ERC721)
│  ├─ 펭귄 NFT 컬렉션 (총 1,000개)
│  ├─ 펭귄 Minecraft 스킨 메타데이터
│  └─ IPFS 기반 이미지/애니메이션
│
└─ NFTOwnershipVerifier.sol (CCIP Sender)
   └─ Monad Penguins 소유권 검증 및 attestation 생성

        ↓ Chainlink CCIP (15-30분)

[Monad Testnet]
├─ MonadCCIPReceiver.sol (CCIP Receiver)
│  └─ Sepolia attestation 수신 및 저장
│
└─ MinecraftPFPWithWealth.sol (NFT Minting)
   └─ Penguin Rescuer 체크 → 특수 trait 추가
```

---

## 🎨 Phase 1: Monad Penguins NFT 컬렉션 설계

### 1.1 스마트 컨트랙트: MonadPenguins.sol

**위치**: `contracts/sepolia/MonadPenguins.sol` (신규)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MonadPenguins
 * @notice 모나드에서 길을 잃은 펭귄들의 NFT 컬렉션
 * @dev ERC721 기반, IPFS 메타데이터, 총 1,000개 한정
 */
contract MonadPenguins is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MINT_PRICE = 0.001 ether; // Sepolia ETH
    string public baseTokenURI;

    mapping(uint256 => PenguinTraits) public penguinTraits;

    struct PenguinTraits {
        uint8 bodyColor;      // 0-9: 펭귄 몸통 색상 (흰색, 회색, 파란색 등)
        uint8 beakType;       // 0-4: 부리 모양
        uint8 eyeType;        // 0-6: 눈 모양 (졸린 눈, 반짝이는 눈 등)
        uint8 accessory;      // 0-9: 액세서리 (스카프, 모자, 안경 등)
        uint8 background;     // 0-7: 배경 (얼음 동굴, 눈보라, 오로라 등)
        uint8 rarity;         // 0-3: 희귀도 (Common, Rare, Epic, Legendary)
        uint256 rescueNumber; // 구출 순서 번호
    }

    event PenguinMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 rescueNumber
    );

    constructor(string memory _baseTokenURI) ERC721("Monad Penguins", "MPEN") {
        baseTokenURI = _baseTokenURI;
    }

    /**
     * @notice 펭귄 NFT 민팅
     * @dev 최대 1,000개까지 민팅 가능
     */
    function mint() public payable returns (uint256) {
        require(_tokenIdCounter.current() < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // 결정론적 trait 생성 (블록해시 + 민터 주소 + 토큰 ID)
        PenguinTraits memory traits = _generateTraits(tokenId, msg.sender);
        penguinTraits[tokenId] = traits;

        _safeMint(msg.sender, tokenId);

        // 메타데이터 URI 설정
        string memory tokenURI = string(
            abi.encodePacked(baseTokenURI, tokenId.toString(), ".json")
        );
        _setTokenURI(tokenId, tokenURI);

        emit PenguinMinted(msg.sender, tokenId, traits.rescueNumber);

        return tokenId;
    }

    /**
     * @notice 결정론적 trait 생성
     */
    function _generateTraits(uint256 tokenId, address minter)
        private
        view
        returns (PenguinTraits memory)
    {
        uint256 randomSeed = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, minter, tokenId))
        );

        return PenguinTraits({
            bodyColor: uint8(randomSeed % 10),
            beakType: uint8((randomSeed / 10) % 5),
            eyeType: uint8((randomSeed / 50) % 7),
            accessory: uint8((randomSeed / 350) % 10),
            background: uint8((randomSeed / 3500) % 8),
            rarity: _calculateRarity(randomSeed),
            rescueNumber: tokenId
        });
    }

    /**
     * @notice 희귀도 계산 (확률 기반)
     * @dev Legendary: 1%, Epic: 9%, Rare: 30%, Common: 60%
     */
    function _calculateRarity(uint256 seed) private pure returns (uint8) {
        uint256 roll = seed % 100;

        if (roll < 1) return 3;  // Legendary (1%)
        if (roll < 10) return 2; // Epic (9%)
        if (roll < 40) return 1; // Rare (30%)
        return 0;                // Common (60%)
    }

    /**
     * @notice 기본 URI 업데이트
     */
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    /**
     * @notice 컨트랙트 잔액 인출
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @notice 총 민팅된 NFT 개수
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @notice 토큰의 trait 조회
     */
    function getTraits(uint256 tokenId) external view returns (PenguinTraits memory) {
        require(_exists(tokenId), "Token does not exist");
        return penguinTraits[tokenId];
    }
}
```

---

### 1.2 펭귄 Trait 시스템

**Trait 카테고리 및 옵션**:

#### Body Color (0-9)
- 0: Classic White & Black (클래식 펭귄)
- 1: Ice Blue (얼음 파랑)
- 2: Glacier Gray (빙하 회색)
- 3: Aurora Purple (오로라 보라)
- 4: Snow White (눈 흰색)
- 5: Midnight Black (한밤 검정)
- 6: Frost Silver (서리 은색)
- 7: Ocean Blue (바다 파랑)
- 8: Sunset Orange (석양 주황)
- 9: Golden Shimmer (황금빛)

#### Beak Type (0-4)
- 0: Standard Orange (표준 주황 부리)
- 1: Long & Sharp (길고 날카로운)
- 2: Short & Round (짧고 둥근)
- 3: Golden Beak (황금 부리)
- 4: Ice Crystal (얼음 결정)

#### Eye Type (0-6)
- 0: Curious Eyes (호기심 가득한 눈)
- 1: Sleepy Eyes (졸린 눈)
- 2: Sparkling Eyes (반짝이는 눈)
- 3: Angry Eyes (화난 눈)
- 4: Heart Eyes (하트 눈)
- 5: X Eyes (X 눈)
- 6: Laser Eyes (레이저 눈)

#### Accessory (0-9)
- 0: None (없음)
- 1: Red Scarf (빨간 목도리)
- 2: Top Hat (실크햇)
- 3: Snow Goggles (스노우 고글)
- 4: Crown (왕관)
- 5: Bow Tie (나비 넥타이)
- 6: Backpack (백팩)
- 7: Wings (날개)
- 8: Fish (물고기)
- 9: Snowflake (눈송이)

#### Background (0-7)
- 0: Ice Cave (얼음 동굴)
- 1: Blizzard (눈보라)
- 2: Aurora Borealis (오로라)
- 3: Frozen Ocean (얼어붙은 바다)
- 4: Snowy Mountain (눈 덮인 산)
- 5: Ice Block (얼음 블록)
- 6: Glacier (빙하)
- 7: Starry Night (별이 빛나는 밤)

#### Rarity (0-3)
- 0: Common (일반) - 60%
- 1: Rare (희귀) - 30%
- 2: Epic (에픽) - 9%
- 3: Legendary (전설) - 1%

---

### 1.3 메타데이터 구조

**IPFS 메타데이터 예시**: `ipfs://QmXXX.../1.json`

```json
{
  "name": "Monad Penguin #1",
  "description": "A lost penguin from the Monad chain, waiting to be rescued. Penguin Rescuers receive special traits on Monad Testnet!",
  "image": "ipfs://QmYYY.../1.png",
  "animation_url": "ipfs://QmZZZ.../1.gif",
  "attributes": [
    {
      "trait_type": "Body Color",
      "value": "Classic White & Black"
    },
    {
      "trait_type": "Beak Type",
      "value": "Standard Orange"
    },
    {
      "trait_type": "Eye Type",
      "value": "Curious Eyes"
    },
    {
      "trait_type": "Accessory",
      "value": "Red Scarf"
    },
    {
      "trait_type": "Background",
      "value": "Aurora Borealis"
    },
    {
      "trait_type": "Rarity",
      "value": "Epic"
    },
    {
      "trait_type": "Rescue Number",
      "value": "1"
    },
    {
      "trait_type": "Chain",
      "value": "Ethereum Sepolia"
    },
    {
      "trait_type": "Collection",
      "value": "Monad Penguins"
    }
  ],
  "external_url": "https://monad-penguins.xyz/penguin/1"
}
```

---

## 🐧 Phase 2: 펭귄 스킨 생성 시스템

### 2.1 Minecraft 64x64 펭귄 스킨 UV 매핑

**펭귄 스킨의 특징**:
- 머리: 검은색 + 흰색 패턴 (펭귄 머리)
- 몸통: 흰색 배, 검은색 등
- 팔: 짧고 날개 모양
- 다리: 주황색 오리발
- 액세서리: 목도리, 모자 등

**UV 좌표 할당**:
```
Head (8x8x8):
- Front Face: (8, 8) ~ (16, 16)   → 펭귄 얼굴 (부리, 눈)
- Top: (8, 0) ~ (16, 8)           → 머리 위 (모자/왕관 위치)
- Overlay: (40, 8) ~ (48, 16)     → 액세서리 (스카프, 고글)

Body (8x12x4):
- Front: (20, 20) ~ (28, 32)      → 흰색 배
- Back: (32, 20) ~ (40, 32)       → 검은색 등

Arms (4x12x4):
- Right: (44, 20) ~ (48, 32)      → 날개
- Left: (36, 52) ~ (40, 64)       → 날개

Legs (4x12x4):
- Right: (4, 20) ~ (8, 32)        → 주황 오리발
- Left: (20, 52) ~ (24, 64)       → 주황 오리발
```

### 2.2 AI 스킨 생성 프롬프트

**Claude Haiku 4.5 프롬프트 템플릿**:

```typescript
const penguinSkinPrompt = `
Create a Minecraft 64x64 skin texture for a PENGUIN character with these traits:

PENGUIN CHARACTERISTICS:
- Body Color: ${traits.bodyColor}
- Beak Type: ${traits.beakType}
- Eye Type: ${traits.eyeType}
- Accessory: ${traits.accessory}

STRICT REQUIREMENTS:
1. Use official Minecraft 64x64 UV mapping
2. Penguin features:
   - Head: Black top, white face with ${traits.beakType} beak
   - Eyes: ${traits.eyeType} positioned at (10,12) and (13,12)
   - Body Front: White belly
   - Body Back: Black back
   - Arms: Short penguin wings (black)
   - Legs: Orange webbed feet

3. Color Palette:
   - Main body: ${getBodyColorHex(traits.bodyColor)}
   - Beak: ${getBeakColorHex(traits.beakType)}
   - Eyes: Based on ${traits.eyeType}
   - Accessory: ${getAccessoryColorHex(traits.accessory)}

4. Accessory Placement:
   ${renderAccessoryGuide(traits.accessory)}

5. Apply subtle dithering for depth (checkerboard pattern)

Return ONLY the base64 PNG image data.
`;
```

### 2.3 스킨 생성 라이브러리

**위치**: `src/lib/penguinSkinGenerator.ts` (신규)

```typescript
import { PenguinTraits } from '@/types/penguin';

export interface PenguinColorScheme {
  bodyMain: string;
  bodySecondary: string;
  belly: string;
  back: string;
  beak: string;
  eyes: string;
  feet: string;
  accessory: string;
}

/**
 * 펭귄 trait을 기반으로 색상 스킴 생성
 */
export function generatePenguinColorScheme(
  traits: PenguinTraits
): PenguinColorScheme {
  // Body Color 매핑
  const bodyColors = [
    { main: '#000000', secondary: '#FFFFFF' }, // Classic
    { main: '#87CEEB', secondary: '#E0F6FF' }, // Ice Blue
    { main: '#708090', secondary: '#D3D3D3' }, // Glacier Gray
    { main: '#9370DB', secondary: '#E6E6FA' }, // Aurora Purple
    { main: '#FFFAFA', secondary: '#F0F8FF' }, // Snow White
    { main: '#191970', secondary: '#4B0082' }, // Midnight Black
    { main: '#C0C0C0', secondary: '#F5F5F5' }, // Frost Silver
    { main: '#1E90FF', secondary: '#87CEFA' }, // Ocean Blue
    { main: '#FF8C00', secondary: '#FFA500' }, // Sunset Orange
    { main: '#FFD700', secondary: '#FFEC8B' }, // Golden Shimmer
  ];

  // Beak Color 매핑
  const beakColors = ['#FFA500', '#FF6347', '#FFD700', '#FF4500', '#87CEEB'];

  // Eye Color (타입별)
  const eyeColors = ['#000000', '#8B4513', '#00BFFF', '#FF0000', '#FF69B4', '#FFFFFF', '#FF0000'];

  const bodyColor = bodyColors[traits.bodyColor];

  return {
    bodyMain: bodyColor.main,
    bodySecondary: bodyColor.secondary,
    belly: '#FFFFFF',
    back: bodyColor.main,
    beak: beakColors[traits.beakType],
    eyes: eyeColors[traits.eyeType],
    feet: '#FFA500', // 항상 주황색 오리발
    accessory: getAccessoryColor(traits.accessory),
  };
}

/**
 * 액세서리 색상 결정
 */
function getAccessoryColor(accessory: number): string {
  const colors = [
    '#FFFFFF', // None
    '#FF0000', // Red Scarf
    '#000000', // Top Hat
    '#4169E1', // Snow Goggles
    '#FFD700', // Crown
    '#000000', // Bow Tie
    '#8B4513', // Backpack
    '#FFFFFF', // Wings
    '#FF6347', // Fish
    '#E0F6FF', // Snowflake
  ];
  return colors[accessory];
}

/**
 * 캔버스에 펭귄 스킨 렌더링
 */
export function renderPenguinSkin(
  ctx: CanvasRenderingContext2D,
  colorScheme: PenguinColorScheme,
  traits: PenguinTraits
): void {
  // 1. 배경 투명
  ctx.clearRect(0, 0, 64, 64);

  // 2. Head - Front Face (펭귄 얼굴)
  renderPenguinFace(ctx, colorScheme, traits);

  // 3. Head - Top (머리 위)
  renderPenguinHead(ctx, colorScheme, traits);

  // 4. Body - Front (흰색 배)
  ctx.fillStyle = colorScheme.belly;
  ctx.fillRect(20, 20, 8, 12);

  // 5. Body - Back (검은색 등)
  ctx.fillStyle = colorScheme.back;
  ctx.fillRect(32, 20, 8, 12);

  // 6. Arms (짧은 날개)
  renderPenguinWings(ctx, colorScheme);

  // 7. Legs (주황 오리발)
  renderPenguinFeet(ctx, colorScheme);

  // 8. Accessory
  renderPenguinAccessory(ctx, colorScheme, traits);
}

/**
 * 펭귄 얼굴 렌더링 (부리, 눈)
 */
function renderPenguinFace(
  ctx: CanvasRenderingContext2D,
  colorScheme: PenguinColorScheme,
  traits: PenguinTraits
): void {
  // 얼굴 베이스 (흰색)
  ctx.fillStyle = colorScheme.bodySecondary;
  ctx.fillRect(8, 8, 8, 8);

  // 머리 위 (검은색)
  ctx.fillStyle = colorScheme.bodyMain;
  ctx.fillRect(8, 8, 8, 3);

  // 눈 렌더링
  ctx.fillStyle = colorScheme.eyes;
  ctx.fillRect(10, 12, 1, 1); // 왼쪽 눈
  ctx.fillRect(13, 12, 1, 1); // 오른쪽 눈

  // 부리 렌더링 (타입에 따라)
  renderBeak(ctx, colorScheme.beak, traits.beakType);
}

/**
 * 부리 렌더링 (타입별)
 */
function renderBeak(ctx: CanvasRenderingContext2D, color: string, type: number): void {
  ctx.fillStyle = color;

  switch (type) {
    case 0: // Standard
      ctx.fillRect(11, 13, 2, 1);
      break;
    case 1: // Long & Sharp
      ctx.fillRect(11, 13, 2, 2);
      break;
    case 2: // Short & Round
      ctx.fillRect(11, 13, 2, 1);
      ctx.fillRect(12, 14, 1, 1);
      break;
    case 3: // Golden Beak
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(11, 13, 2, 1);
      break;
    case 4: // Ice Crystal
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(11, 13, 2, 2);
      ctx.fillStyle = '#E0F6FF';
      ctx.fillRect(11, 13, 1, 1);
      break;
  }
}

/**
 * 펭귄 머리 렌더링
 */
function renderPenguinHead(
  ctx: CanvasRenderingContext2D,
  colorScheme: PenguinColorScheme,
  traits: PenguinTraits
): void {
  ctx.fillStyle = colorScheme.bodyMain;
  ctx.fillRect(8, 0, 8, 8);
}

/**
 * 펭귄 날개 렌더링
 */
function renderPenguinWings(
  ctx: CanvasRenderingContext2D,
  colorScheme: PenguinColorScheme
): void {
  ctx.fillStyle = colorScheme.bodyMain;
  // Right wing
  ctx.fillRect(44, 20, 4, 12);
  // Left wing
  ctx.fillRect(36, 52, 4, 12);
}

/**
 * 펭귄 오리발 렌더링
 */
function renderPenguinFeet(
  ctx: CanvasRenderingContext2D,
  colorScheme: PenguinColorScheme
): void {
  ctx.fillStyle = colorScheme.feet;
  // Right foot
  ctx.fillRect(4, 20, 4, 12);
  // Left foot
  ctx.fillRect(20, 52, 4, 12);
}

/**
 * 액세서리 렌더링 (Head Overlay)
 */
function renderPenguinAccessory(
  ctx: CanvasRenderingContext2D,
  colorScheme: PenguinColorScheme,
  traits: PenguinTraits
): void {
  const accessory = traits.accessory;

  switch (accessory) {
    case 0: // None
      break;

    case 1: // Red Scarf
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(20, 30, 8, 2); // 몸에 스카프
      break;

    case 2: // Top Hat
      ctx.fillStyle = '#000000';
      ctx.fillRect(40, 8, 8, 3); // 모자
      ctx.fillRect(41, 11, 6, 1); // 챙
      break;

    case 3: // Snow Goggles
      ctx.fillStyle = '#4169E1';
      ctx.fillRect(40, 12, 8, 2); // 고글
      break;

    case 4: // Crown
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(40, 8, 8, 2); // 왕관
      ctx.fillRect(41, 10, 1, 1);
      ctx.fillRect(43, 10, 1, 1);
      ctx.fillRect(45, 10, 1, 1);
      break;

    case 5: // Bow Tie
      ctx.fillStyle = '#000000';
      ctx.fillRect(22, 31, 4, 1); // 나비 넥타이
      break;

    case 6: // Backpack
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(32, 22, 8, 6); // 백팩 (등)
      break;

    case 7: // Wings (추가 날개)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(42, 22, 2, 4);
      ctx.fillRect(48, 22, 2, 4);
      break;

    case 8: // Fish (들고 있는 물고기)
      ctx.fillStyle = '#FF6347';
      ctx.fillRect(46, 24, 2, 4);
      break;

    case 9: // Snowflake
      ctx.fillStyle = '#E0F6FF';
      ctx.fillRect(41, 9, 6, 1);
      ctx.fillRect(43, 8, 2, 3);
      break;
  }
}
```

---

## 🌉 Phase 3: CCIP 통합 및 특수 Trait 시스템

### 3.1 기존 CCIP 시스템 재사용

기존 `CCIP_CROSSCHAIN_IMPLEMENTATION_PLAN.md`의 시스템을 그대로 활용:

1. **NFTOwnershipVerifier.sol** (Sepolia)
   - `supportedNFTs`에 `MonadPenguins` 컨트랙트 주소 추가

2. **MonadCCIPReceiver.sol** (Monad)
   - 변경 없음, 그대로 사용

3. **MinecraftPFPWithWealth.sol** (Monad)
   - CCIP attestation 체크 로직 활용

### 3.2 Monad에서의 특수 Trait: Penguin Rescuer

**특수 trait 종류**:

1. **Ice Crown (얼음 왕관)**
   - 머리 위 파란색 왕관
   - UV: (40, 8) ~ (48, 16)

2. **Penguin Companion (펭귄 친구)**
   - 어깨 위 작은 펭귄
   - UV: (48, 20) ~ (52, 26)

3. **Snowflake Aura (눈송이 오라)**
   - 몸 주위 눈송이 이펙트
   - 메타데이터 속성으로 표시

**메타데이터 예시 (Penguin Rescuer)**:

```json
{
  "name": "Minecraft PFP #42",
  "description": "A unique Minecraft PFP with Penguin Rescuer traits, earned by owning a Monad Penguin on Ethereum Sepolia.",
  "attributes": [
    {
      "trait_type": "Penguin Rescuer",
      "value": "Yes"
    },
    {
      "trait_type": "Special Trait",
      "value": "Ice Crown"
    },
    {
      "trait_type": "Companion",
      "value": "Baby Penguin"
    },
    {
      "trait_type": "Aura",
      "value": "Snowflake Effect"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Rescued Penguin ID",
      "value": "123"
    }
  ]
}
```

### 3.3 스킨 생성 시 Penguin Rescuer Trait 추가

**위치**: `src/lib/aiSkinGenerator.ts` (수정)

```typescript
/**
 * Ice Crown 렌더링 (Penguin Rescuer 전용)
 */
function renderIceCrown(ctx: CanvasRenderingContext2D): void {
  const ICE_BLUE = '#87CEEB';
  const ICE_LIGHT = '#E0F6FF';
  const ICE_DARK = '#4682B4';

  const crownPixels = [
    // 베이스
    { x: 41, y: 15, color: ICE_DARK },
    { x: 42, y: 15, color: ICE_BLUE },
    { x: 43, y: 15, color: ICE_BLUE },
    { x: 44, y: 15, color: ICE_BLUE },
    { x: 45, y: 15, color: ICE_BLUE },
    { x: 46, y: 15, color: ICE_DARK },

    // 중간
    { x: 41, y: 14, color: ICE_BLUE },
    { x: 42, y: 14, color: ICE_LIGHT },
    { x: 43, y: 14, color: ICE_BLUE },
    { x: 44, y: 14, color: ICE_BLUE },
    { x: 45, y: 14, color: ICE_LIGHT },
    { x: 46, y: 14, color: ICE_BLUE },

    // 뾰족 부분
    { x: 42, y: 13, color: ICE_LIGHT },
    { x: 43, y: 13, color: ICE_BLUE },
    { x: 44, y: 13, color: ICE_BLUE },
    { x: 45, y: 13, color: ICE_LIGHT },

    // 정상
    { x: 42, y: 12, color: ICE_BLUE },
    { x: 45, y: 12, color: ICE_BLUE },

    // 반짝임
    { x: 43, y: 12, color: ICE_LIGHT },
    { x: 44, y: 12, color: ICE_LIGHT },
  ];

  crownPixels.forEach(({ x, y, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  });
}

/**
 * Baby Penguin Companion 렌더링
 */
function renderPenguinCompanion(ctx: CanvasRenderingContext2D): void {
  // 어깨 위치에 작은 펭귄 (4x6 픽셀)
  const PENGUIN_BLACK = '#000000';
  const PENGUIN_WHITE = '#FFFFFF';
  const BEAK_ORANGE = '#FFA500';

  // 몸 (왼쪽 어깨)
  ctx.fillStyle = PENGUIN_BLACK;
  ctx.fillRect(48, 20, 2, 3); // 머리
  ctx.fillStyle = PENGUIN_WHITE;
  ctx.fillRect(48, 23, 2, 3); // 배

  // 눈
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(48, 21, 1, 1);
  ctx.fillRect(49, 21, 1, 1);

  // 부리
  ctx.fillStyle = BEAK_ORANGE;
  ctx.fillRect(48, 22, 2, 1);
}
```

---

## 📋 Phase 4: 구현 체크리스트

### Smart Contracts (Sepolia)
- [ ] MonadPenguins.sol 작성
  - [ ] ERC721 기본 구현
  - [ ] Trait 생성 로직
  - [ ] 희귀도 시스템
  - [ ] 최대 공급량 제한 (1,000개)
- [ ] 배포 스크립트 작성
- [ ] Sepolia에 배포
- [ ] Etherscan 검증
- [ ] 메타데이터 IPFS 업로드

### Penguin Skin Generator
- [ ] `src/lib/penguinSkinGenerator.ts` 작성
- [ ] 색상 스킴 매핑
- [ ] UV 매핑 정확도 검증
- [ ] 액세서리 렌더링 구현
- [ ] AI 생성 프롬프트 템플릿

### CCIP Integration
- [ ] NFTOwnershipVerifier에 MonadPenguins 추가
- [ ] 프론트엔드 UI 업데이트
  - [ ] Monad Penguins 소유 여부 체크
  - [ ] Attestation 생성 UI
- [ ] Monad에서 Ice Crown 렌더링 구현
- [ ] Penguin Companion 렌더링 구현

### Frontend
- [ ] Sepolia Monad Penguins 갤러리 페이지
- [ ] 개별 펭귄 상세 페이지
- [ ] 민팅 UI
- [ ] CCIP 연동 상태 표시

### Testing
- [ ] Sepolia 테스트넷 펭귄 민팅
- [ ] CCIP 플로우 테스트
- [ ] Monad에서 특수 trait 확인
- [ ] 메타데이터 검증

---

## 🚀 구현 순서

### 1단계: Monad Penguins NFT 컬렉션 (3-4시간)
1. `MonadPenguins.sol` 작성 및 테스트
2. 배포 스크립트 작성
3. Sepolia에 배포
4. 메타데이터 구조 확정

### 2단계: 펭귄 스킨 생성기 (2-3시간)
1. `penguinSkinGenerator.ts` 구현
2. Trait 렌더링 함수 작성
3. AI 프롬프트 템플릿 작성
4. 테스트 스킨 생성

### 3단계: CCIP 통합 (2시간)
1. NFTOwnershipVerifier에 펭귄 추가
2. 프론트엔드 체크 로직 추가
3. Ice Crown 렌더링 구현

### 4단계: 프론트엔드 UI (3-4시간)
1. 펭귄 갤러리 페이지
2. 민팅 인터페이스
3. CCIP 상태 모니터링

### 5단계: 테스트 및 배포 (2-3시간)
1. E2E 테스트
2. 메타데이터 IPFS 업로드
3. 최종 검증

**총 예상 시간**: 12-16시간

---

## 📊 예상 비용

### Sepolia 배포
- 컨트랙트 배포: ~0.01 Sepolia ETH
- 메타데이터 IPFS 업로드: 무료 (Pinata/NFT.Storage)

### 사용자 비용
- Monad Penguins 민팅: 0.001 Sepolia ETH
- CCIP 메시지 전송: ~0.002 Sepolia ETH
- Monad PFP 민팅: 가스비만

---

## 🎯 마케팅 포인트

1. **크로스체인 유틸리티**: Sepolia NFT가 Monad에서 실제 혜택 제공
2. **제한된 공급**: 1,000개 한정, 희귀성 증가
3. **스토리텔링**: "길을 잃은 펭귄 구출" 내러티브
4. **특수 trait**: Ice Crown, Penguin Companion 등 시각적 차별화
5. **Legendary 등급**: CCIP 검증된 NFT는 자동 Legendary

---

**다음 단계**: 이 계획서를 기반으로 `MonadPenguins.sol` 작성부터 시작하시겠습니까?

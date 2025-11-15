# Wealth-Based Special Items 시스템

## 💰 Chainlink Price Feed 통합

### 1. 사용 Price Feeds

**Price Feeds**:
- ETH/USD
- USDT/USD
- USDC/USD

### 2. 네트워크별 주소

#### Ethereum Mainnet
```
ETH/USD:  0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
USDT/USD: 0x3E7d1eAB13ad0104d273B42c5c5a4e3F3A9b6d3e
USDC/USD: 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6

USDT: 0xdAC17F958D2ee523a2206206994597C13D831ec7
USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

#### Sepolia Testnet
```
ETH/USD:  0x694AA1769357215DE4FAC081bf1f309aDC325306
USDT/USD: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
USDC/USD: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E

USDT: 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06
USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
```

---

## 💵 자산 가치 계산 로직

### Solidity 구현

```solidity
function calculateTotalWealth(address owner) public view returns (
    uint256 ethValueUSD,
    uint256 usdtValueUSD,
    uint256 usdcValueUSD,
    uint256 totalValueUSD
) {
    // ETH: 18 decimals
    uint256 ethBalance = owner.balance;
    uint256 ethPrice = getETHPriceUSD(); // 8 decimals
    ethValueUSD = (ethBalance * ethPrice) / 1e18;

    // USDT: 6 decimals
    uint256 usdtBalance = IERC20(USDT).balanceOf(owner);
    uint256 usdtPrice = getUSDTPriceUSD(); // 8 decimals
    usdtValueUSD = (usdtBalance * usdtPrice) / 1e6;

    // USDC: 6 decimals
    uint256 usdcBalance = IERC20(USDC).balanceOf(owner);
    uint256 usdcPrice = getUSDCPriceUSD(); // 8 decimals
    usdcValueUSD = (usdcBalance * usdcPrice) / 1e6;

    totalValueUSD = ethValueUSD + usdtValueUSD + usdcValueUSD;
}
```

### Price Feed 안전성 검사

```solidity
function getETHPriceUSD() public view returns (uint256) {
    (, int256 price, , uint256 updatedAt, ) = ethUsdPriceFeed.latestRoundData();
    require(price > 0, "Invalid ETH price");
    require(block.timestamp - updatedAt < 1 hours, "Stale ETH price");
    return uint256(price);
}
```

---

## 🏆 Wealth Tier 시스템

### Tier 구조

| Tier | 최소 자산 (USD) | 등급명 | Special Item Range |
|------|----------------|--------|-------------------|
| 0 | $0 | None | 없음 |
| 1 | $1,000 | Bronze | 1-3 |
| 2 | $10,000 | Silver | 4-6 |
| 3 | $50,000 | Gold | 7-10 |
| 4 | $100,000 | Platinum | 11-14 |
| 5 | $500,000 | Diamond | 15-19 |

### Tier 결정 로직

```solidity
function getWealthTier(uint256 totalValueUSD) public pure returns (uint8) {
    if (totalValueUSD >= TIER_DIAMOND) return 5;
    if (totalValueUSD >= TIER_PLATINUM) return 4;
    if (totalValueUSD >= TIER_GOLD) return 3;
    if (totalValueUSD >= TIER_SILVER) return 2;
    if (totalValueUSD >= TIER_BRONZE) return 1;
    return 0;
}
```

---

## 🎁 Special Items 목록

### Bronze Tier (1-3) - 기본 액세서리
```
1: Wooden Sword    - 나무 검
2: Leather Cape    - 가죽 망토
3: Iron Shield     - 철 방패
```

**특징**:
- 기본적인 아이템
- 글로우 효과 없음
- 정적 렌더링

### Silver Tier (4-6) - 빛나는 아이템
```
4: Steel Sword     - 강철 검 (은색 글로우)
5: Silver Crown    - 은색 왕관 (은색 글로우)
6: Magic Staff     - 마법 지팡이 (파란색 글로우)
```

**특징**:
- 은색/파란색 글로우 효과
- emissiveIntensity: 0.5
- 정적 렌더링

### Gold Tier (7-10) - 프리미엄 아이템
```
7: Golden Sword     - 황금 검 (금색 글로우)
8: Golden Crown     - 황금 왕관 (금색 글로우)
9: Wings            - 날개 (흰색 글로우, 애니메이션)
10: Enchanted Book  - 마법책 (보라색 글로우)
```

**특징**:
- 금색/흰색/보라색 글로우
- emissiveIntensity: 0.7
- Wings는 펄럭이는 애니메이션

### Platinum Tier (11-14) - 파티클 효과
```
11: Diamond Sword    - 다이아몬드 검 (청록색 글로우, 파티클)
12: Platinum Armor   - 백금 갑옷 (백금색 글로우, 파티클)
13: Angel Wings      - 천사 날개 (흰색 글로우, 애니메이션, 파티클)
14: Mystic Orb       - 신비한 구슬 (자홍색 글로우, 애니메이션, 파티클)
```

**특징**:
- 강렬한 글로우 (emissiveIntensity: 0.9)
- 파티클 시스템 (100개 파티클)
- 애니메이션 (회전, 부유)

### Diamond Tier (15-19) - 오라 효과
```
15: Legendary Blade  - 전설의 검 (핑크색 글로우, 파티클, 무지개 오라)
16: Dragon Wings     - 드래곤 날개 (주황색 글로우, 애니메이션, 파티클, 불 오라)
17: Celestial Crown  - 천상의 왕관 (금색 글로우, 파티클, 별 오라)
18: Infinity Gauntlet - 인피니티 건틀릿 (보라색 글로우, 파티클, 우주 오라)
19: God Armor Set    - 신의 갑옷 세트 (흰색 글로우, 파티클, 신성한 오라)
```

**특징**:
- 최대 강도 글로우 (emissiveIntensity: 1.0)
- 고밀도 파티클 시스템 (200개 파티클)
- 고급 애니메이션
- 특별 오라 효과 (무지개, 불, 별, 우주, 신성)

---

## 🎲 Special Item ID 생성

### Deterministic Random

```solidity
function getSpecialItemFromWealth(uint8 tier, address owner) public pure returns (uint8) {
    if (tier == 0) return 0;

    uint256 seed = uint256(keccak256(abi.encodePacked(owner, tier)));

    if (tier == 1) return uint8(seed % 3) + 1;   // 1-3
    if (tier == 2) return uint8(seed % 3) + 4;   // 4-6
    if (tier == 3) return uint8(seed % 4) + 7;   // 7-10
    if (tier == 4) return uint8(seed % 4) + 11;  // 11-14
    return uint8(seed % 5) + 15;                  // 15-19
}
```

**특징**:
- 주소와 Tier를 조합하여 시드 생성
- 동일한 주소 + Tier는 항상 동일한 아이템
- Tier 내에서 균등 분포

---

## 📸 민팅 시점 스냅샷

### Snapshot 구조

```solidity
struct MintSnapshot {
    uint256 totalWealthUSD;  // 총 자산 (8 decimals)
    uint8 wealthTier;         // 등급 (0-5)
    uint256 ethBalance;       // ETH 잔액
    uint256 usdtBalance;      // USDT 잔액
    uint256 usdcBalance;      // USDC 잔액
    uint256 timestamp;        // 민팅 시각
}
```

### 스냅샷 저장

```solidity
mintSnapshots[tokenId] = MintSnapshot({
    totalWealthUSD: totalValueUSD,
    wealthTier: tier,
    ethBalance: msg.sender.balance,
    usdtBalance: IERC20(USDT).balanceOf(msg.sender),
    usdcBalance: IERC20(USDC).balanceOf(msg.sender),
    timestamp: block.timestamp
});
```

### 스냅샷 특징

**영구성**:
- 민팅 시점의 자산 가치가 영구적으로 고정됨
- 이후 자산이 증가/감소해도 NFT 속성은 변하지 않음

**투명성**:
- 모든 데이터가 온체인에 기록됨
- 누구나 검증 가능

**타임스탬프**:
- 정확한 민팅 시각 기록
- 역사적 자산 가치 추적 가능

---

## 🔍 조회 함수

### 미리보기 (민팅 전)

```solidity
function previewMint(address owner) public view returns (
    TraitGenerator.SkinTraits memory traits,
    uint256 totalWealthUSD,
    uint8 wealthTier,
    uint8 specialItem,
    uint256 ethValueUSD,
    uint256 usdtValueUSD,
    uint256 usdcValueUSD
) {
    traits = owner.generateTraits();
    (ethValueUSD, usdtValueUSD, usdcValueUSD, totalWealthUSD) = calculateTotalWealth(owner);
    wealthTier = getWealthTier(totalValueUSD);
    specialItem = getSpecialItemFromWealth(wealthTier, owner);

    return (traits, totalWealthUSD, wealthTier, specialItem, ethValueUSD, usdtValueUSD, usdcValueUSD);
}
```

### 토큰 정보 조회

```solidity
function getTokenInfo(uint256 tokenId) public view returns (
    address owner,
    TraitGenerator.SkinTraits memory traits,
    uint256 totalWealthUSD,
    uint8 wealthTier,
    uint8 specialItem,
    uint256 mintTimestamp
) {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");

    owner = ownerOf(tokenId);
    traits = owner.generateTraits();

    MintSnapshot memory snapshot = mintSnapshots[tokenId];
    totalWealthUSD = snapshot.totalWealthUSD;
    wealthTier = snapshot.wealthTier;
    specialItem = getSpecialItemFromWealth(wealthTier, owner);
    mintTimestamp = snapshot.timestamp;

    return (owner, traits, totalWealthUSD, wealthTier, specialItem, mintTimestamp);
}
```

---

## 📊 예제 시나리오

### 시나리오 1: Bronze Tier 사용자

```
주소: 0x1234...
ETH: 0.5 ETH ($1,500)
USDT: 0
USDC: 0

총 자산: $1,500
Tier: Bronze (1)
Special Item: Wooden Sword (1)
```

### 시나리오 2: Diamond Tier 사용자

```
주소: 0x5678...
ETH: 100 ETH ($300,000)
USDT: $150,000
USDC: $100,000

총 자산: $550,000
Tier: Diamond (5)
Special Item: God Armor Set (19)
```

### 시나리오 3: 자산 변동 후

```
민팅 시:
- 총 자산: $75,000
- Tier: Gold (3)
- Special Item: Golden Sword (7)

3개월 후 자산 증가:
- 총 자산: $600,000

NFT 속성:
- 여전히 Gold Tier
- 여전히 Golden Sword
- 스냅샷 데이터는 불변
```

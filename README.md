# Minecraft PFP NFT

Deterministic trait generation + Wealth-based special items를 특징으로 하는 Minecraft 스타일 PFP NFT 프로젝트입니다.

## 🎨 주요 기능

### 1. Deterministic Trait Generation
- **주소 기반 속성 생성**: 동일한 지갑 주소는 항상 동일한 NFT 속성을 생성합니다
- **5개 세그먼트 분할**: 20 bytes 주소를 5개의 4-byte 세그먼트로 나누어 각각 다른 속성 결정
  - Segment 1 (0-3 bytes): 모자 (Hat)
  - Segment 2 (4-7 bytes): 옷 (Clothes)
  - Segment 3 (8-11 bytes): 신발 (Shoes)
  - Segment 4 (12-15 bytes): 바지 (Pants)
  - Segment 5 (16-19 bytes): 피부 (Skin)

### 2. Wealth-based Special Items
- **Chainlink Price Feeds**: ETH, USDT, USDC 실시간 가격 조회
- **자산 등급 시스템**: 총 자산 가치에 따라 6단계 등급
  - None: < $1,000
  - Bronze: $1,000+
  - Silver: $10,000+
  - Gold: $50,000+
  - Platinum: $100,000+
  - Diamond: $500,000+
- **특별 아이템**: 등급별로 다른 Minecraft 아이템 부여

### 3. 3D Animation & IPFS
- **Three.js 렌더링**: 64x64 Minecraft 스킨을 3D 모델로 렌더링
- **60프레임 GIF**: 360도 회전 애니메이션
- **IPFS 저장**: Pinata를 통한 탈중앙화 저장

## 🛠️ 기술 스택

### Smart Contract
- Solidity 0.8.20
- OpenZeppelin ERC721URIStorage
- Chainlink Price Feeds
- Hardhat

### Frontend
- Next.js 14+
- TypeScript 5+
- Tailwind CSS
- Wagmi + RainbowKit
- Three.js
- gif.js

### Infrastructure
- IPFS (Pinata)
- Ethereum Sepolia Testnet

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

필수 환경 변수:
- `SEPOLIA_RPC_URL`: Sepolia RPC URL
- `PRIVATE_KEY`: 배포자 개인키
- `NEXT_PUBLIC_PINATA_JWT`: Pinata JWT
- `NEXT_PUBLIC_PINATA_GATEWAY`: Pinata Gateway URL

### 3. 스마트 컨트랙트 컴파일

```bash
pnpm compile
```

### 4. 테스트 실행

```bash
pnpm test:contracts
```

### 5. 배포 (Sepolia Testnet)

```bash
pnpm deploy:sepolia
```

### 6. 프론트엔드 실행

```bash
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

## 🧪 테스트

### 스마트 컨트랙트 테스트

```bash
pnpm test:contracts
```

테스트 항목:
- ✅ Deterministic trait 생성 검증
- ✅ Wealth tier 계산 정확성
- ✅ Special item 할당
- ✅ 민팅 프로세스
- ✅ 중복 민팅 방지

## 📝 프로젝트 구조

```
minecraft-pfp/
├── contracts/              # Solidity 스마트 컨트랙트
│   ├── TraitGenerator.sol
│   └── MinecraftPFPWithWealth.sol
├── test/                   # 컨트랙트 테스트
├── scripts/                # 배포 스크립트
├── src/
│   ├── app/               # Next.js 앱
│   ├── components/        # React 컴포넌트
│   ├── lib/               # 핵심 라이브러리
│   │   ├── traitGenerator.ts
│   │   ├── skinRenderer.ts
│   │   ├── gifGenerator.ts
│   │   ├── ipfs.ts
│   │   └── mintPipeline.ts
│   ├── types/             # TypeScript 타입
│   └── utils/             # 유틸리티 함수
└── docs/                  # 문서
```

## 🔍 주요 알고리즘

### Trait 생성 알고리즘

```typescript
// 1. 주소를 20 bytes로 변환
const addrBytes = addressToBytes(address);

// 2. 각 세그먼트 추출 (4 bytes씩)
const seg1 = bytesToUint32(addrBytes, 0);  // Hat
const seg2 = bytesToUint32(addrBytes, 4);  // Clothes
// ...

// 3. 속성 결정
traits.hatStyle = seg1 % 10;                    // 0-9
traits.hatColor = getColorFamily(seg1);          // 0-5
traits.hatOpacity = ((seg1 >> 8) % 156) + 100;  // 100-255
```

### 색상 계열 결정

```typescript
function getColorFamily(segment: number): ColorFamily {
    if (segment % 3 === 0) return ColorFamily.BLUE;
    if (segment % 5 === 0) return ColorFamily.YELLOW;
    if (segment % 7 === 0) return ColorFamily.RED;
    if (segment % 11 === 0) return ColorFamily.GREEN;
    if (segment % 13 === 0) return ColorFamily.PURPLE;
    return ColorFamily.NEUTRAL;
}
```

## 🚀 배포 정보

### Sepolia Testnet
- Contract: TBD (배포 후 업데이트)
- Chainlink Price Feeds:
  - ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
  - USDT/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`
  - USDC/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR은 언제나 환영합니다!

## 📚 참고 문서

- [Architecture](./docs/ARCHITECTURE.md)
- [NFT Traits](./docs/NFT_TRAITS.md)
- [Wealth System](./docs/WEALTH_SYSTEM.md)
- [Smart Contract](./docs/SMART_CONTRACT.md)
- [Metadata Schema](./docs/METADATA_SCHEMA.md)

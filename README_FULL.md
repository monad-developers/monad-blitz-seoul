# Minecraft PFP NFT

AI 기반 스킨 생성 + Deterministic trait generation + Wealth-based special items + CCIP Cross-chain을 특징으로 하는 Minecraft 스타일 PFP NFT 프로젝트입니다.

## 🎨 주요 기능

### 1. AI-Powered Skin Generation ✨
- **Claude Haiku 4.5 통합**: Anthropic AI를 활용한 고품질 픽셀 아트 스킨 자동 생성
- **Trait 기반 프롬프트**: 결정론적 Trait를 AI 프롬프트로 변환
- **UV 매핑 최적화**: 64x64 Minecraft 텍스처 레이아웃 완벽 지원
- **디더링 픽셀 아트**: 하이라이트/쉐도우 색상을 활용한 3D 깊이감 표현
- **CCIP Golden Crown**: 크로스체인 attestation 보유자 전용 황금 왕관 렌더링

### 2. Deterministic Trait Generation
- **주소 기반 속성 생성**: 동일한 지갑 주소는 항상 동일한 NFT 속성을 생성합니다
- **5개 세그먼트 분할**: 20 bytes 주소를 5개의 4-byte 세그먼트로 나누어 각각 다른 속성 결정
  - Segment 1 (0-3 bytes): 모자 (Hat)
  - Segment 2 (4-7 bytes): 옷 (Clothes)
  - Segment 3 (8-11 bytes): 신발 (Shoes)
  - Segment 4 (12-15 bytes): 바지 (Pants)
  - Segment 5 (16-19 bytes): 피부 (Skin)

### 3. Wealth-based Special Items
- **Chainlink Price Feeds**: ETH, USDT, USDC 실시간 가격 조회
- **자산 등급 시스템**: 총 자산 가치에 따라 6단계 등급
  - None: < $1,000
  - Bronze: $1,000+
  - Silver: $10,000+
  - Gold: $50,000+
  - Platinum: $100,000+
  - Diamond: $500,000+
- **특별 아이템**: 등급별로 다른 Minecraft 아이템 부여

### 4. CCIP Cross-chain Verification 🌉
- **Sepolia → Monad 검증**: Chainlink CCIP를 통한 크로스체인 NFT 소유권 검증
- **NFTOwnershipVerifier (Sepolia)**: NFT 소유 여부를 검증하고 CCIP 메시지 전송
- **MonadCCIPReceiver (Monad)**: attestation 기록 및 Golden Crown 특전 부여
- **실시간 상태 모니터링**: CCIP 메시지 상태 추적 UI

### 5. 3D Animation & Storage
- **Three.js 렌더링**: 64x64 Minecraft 스킨을 3D 모델로 렌더링
- **skinview3d**: 마인크래프트 스킨 전용 3D 뷰어
- **Supabase 저장**: 생성된 스킨 데이터를 데이터베이스에 저장
- **캐싱 시스템**: 동일 주소 재요청 시 캐시된 스킨 반환

## 🛠️ 기술 스택

### Smart Contract
- Solidity 0.8.20
- OpenZeppelin ERC721URIStorage
- Chainlink Price Feeds
- Chainlink CCIP (Cross-chain)
- Hardhat

### AI & Backend
- Anthropic Claude Haiku 4.5 (AI 스킨 생성)
- Supabase (PostgreSQL 데이터베이스)
- @napi-rs/canvas (서버사이드 이미지 생성)

### Frontend
- Next.js 14 (App Router)
- TypeScript 5+
- Tailwind CSS
- Wagmi + RainbowKit
- Three.js + @react-three/fiber
- skinview3d (Minecraft 스킨 뷰어)
- TanStack Query (상태 관리)

### Infrastructure
- Supabase (데이터베이스 & 스토리지)
- Monad Testnet (메인 네트워크)
- Ethereum Sepolia Testnet (CCIP 크로스체인용)

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

**Blockchain**
- `MONAD_TESTNET_RPC_URL`: Monad Testnet RPC URL
- `SEPOLIA_RPC_URL`: Sepolia RPC URL (CCIP용)
- `PRIVATE_KEY`: 배포자 개인키

**AI & Database**
- `ANTHROPIC_API_KEY`: Anthropic Claude API 키
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 롤 키 (서버 전용)

**Contract Addresses**
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: 배포된 MinecraftPFP 컨트랙트 주소
- `NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS`: Sepolia NFTOwnershipVerifier 주소
- `NEXT_PUBLIC_MONAD_RECEIVER_ADDRESS`: Monad CCIPReceiver 주소

### 3. 스마트 컨트랙트 컴파일

```bash
pnpm compile
```

### 4. 테스트 실행

```bash
pnpm test:contracts
```

### 5. 배포

**Monad Testnet (메인 네트워크)**
```bash
pnpm deploy:monad
```

**Sepolia Testnet (CCIP 크로스체인용)**
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
├── contracts/                    # Solidity 스마트 컨트랙트
│   ├── TraitGenerator.sol
│   ├── MinecraftPFPWithWealth.sol
│   ├── sepolia/
│   │   └── NFTOwnershipVerifier.sol  # CCIP 발신자
│   └── monad/
│       └── MonadCCIPReceiver.sol     # CCIP 수신자
├── test/                         # 컨트랙트 테스트
├── scripts/                      # 배포 스크립트
│   ├── deploy.js
│   └── deploy-ccip.js
├── deployments/                  # 배포 정보
├── src/
│   ├── app/                     # Next.js 앱
│   │   ├── api/                 # API 라우트
│   │   │   ├── traits/[address]/
│   │   │   ├── skin/[address]/
│   │   │   └── dev/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── components/              # React 컴포넌트
│   │   ├── minecraft/           # Minecraft UI 컴포넌트
│   │   │   ├── BGPattern.tsx
│   │   │   ├── MinecraftButton.tsx
│   │   │   └── MinecraftCard.tsx
│   │   ├── MintButton.tsx
│   │   ├── TraitPreview.tsx
│   │   ├── MinecraftSkinViewer.tsx
│   │   └── SepoliaNFTVerification.tsx
│   ├── lib/                     # 핵심 라이브러리
│   │   ├── traitGenerator.ts
│   │   ├── aiSkinGenerator.ts   # AI 스킨 생성
│   │   ├── skinRenderer.ts
│   │   ├── gifGenerator.ts
│   │   ├── ipfs.ts
│   │   ├── mintPipeline.ts
│   │   ├── wagmi.ts
│   │   ├── chains.ts
│   │   └── db/                  # Supabase 데이터베이스
│   │       ├── client.ts
│   │       └── supabase.ts
│   ├── types/                   # TypeScript 타입
│   ├── utils/                   # 유틸리티 함수
│   └── config/                  # 설정 파일
└── docs/                        # 문서
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

### Monad Testnet (메인)
- MinecraftPFP Contract: 배포 후 `deployments/` 디렉토리 확인
- MonadCCIPReceiver: 배포 후 `deployments/` 디렉토리 확인

### Sepolia Testnet (CCIP용)
- NFTOwnershipVerifier: 배포 후 `deployments/` 디렉토리 확인
- Chainlink Price Feeds:
  - ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
  - USDT/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`
  - USDC/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`

### CCIP 설정
- Sepolia Router: `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`
- Monad Testnet Selector: `16015286601757825753`

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR은 언제나 환영합니다!

## 📚 참고 문서

### 아키텍처 & 설계
- [Architecture](./ARCHITECTURE.md) - 전체 시스템 아키텍처
- [NFT Traits](./docs/NFT_TRAITS.md) - Trait 생성 알고리즘
- [Wealth System](./docs/WEALTH_SYSTEM.md) - 자산 등급 시스템
- [Smart Contract](./docs/SMART_CONTRACT.md) - 스마트 컨트랙트 상세
- [Metadata Schema](./docs/METADATA_SCHEMA.md) - NFT 메타데이터 스키마

### 새로운 기능
- [AI Skin Generation](./docs/SKIN_GENERATION.md) - AI 기반 스킨 생성
- [Cross-chain NFT](./docs/CROSSCHAIN_NFT.md) - CCIP 크로스체인 검증
- [Deployment Guide](./docs/DEPLOYMENT.md) - 배포 가이드

### 설정 가이드 (claudedocs/)
- [Supabase Setup](./claudedocs/supabase-setup-guide.md) - Supabase 설정
- [DB Setup](./claudedocs/db-setup-guide.md) - 데이터베이스 설정
- [CCIP Implementation](./claudedocs/CCIP_CROSSCHAIN_IMPLEMENTATION_PLAN.md) - CCIP 구현 계획

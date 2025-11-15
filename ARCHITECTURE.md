# Minecraft PFP NFT - 아키텍처 문서

## 프로젝트 개요

Minecraft 스타일의 PFP (Profile Picture) NFT 프로젝트로, 주소 기반 결정론적 속성 생성과 자산 등급 기반 특별 아이템을 제공합니다.

### 주요 기능
- ✅ Ethereum 주소 기반 결정론적 트레잇 생성
- ✅ Chainlink Price Feed를 통한 실시간 자산 가치 계산
- ✅ 자산 등급(Wealth Tier)에 따른 특별 아이템 부여
- ✅ 3D 모델 렌더링 및 애니메이션 GIF 생성
- ✅ IPFS를 통한 탈중앙화 스토리지
- ✅ OpenSea 호환 메타데이터

---

## 시스템 아키텍처

```mermaid
graph TB
    subgraph "Frontend Layer - Next.js"
        A[page.tsx<br/>메인 UI]
        B[MintButton<br/>민팅 버튼]
        C[TraitPreview<br/>속성 미리보기]
        D[SkinRenderer3D<br/>3D 렌더러]
    end

    subgraph "Library Layer"
        E[traitGenerator.ts<br/>트레잇 생성]
        F[skinRenderer.ts<br/>3D 렌더링]
        G[mintPipeline.ts<br/>민팅 파이프라인]
        H[gifGenerator.ts<br/>GIF 생성]
        I[ipfs.ts<br/>IPFS 업로드]
        J[metadata.ts<br/>메타데이터 생성]
    end

    subgraph "Smart Contract Layer - Solidity"
        K[MinecraftPFPWithWealth.sol<br/>메인 NFT 컨트랙트]
        L[TraitGenerator.sol<br/>트레잇 라이브러리]
    end

    subgraph "External Services"
        M[Chainlink Price Feeds<br/>가격 데이터]
        N[IPFS/Pinata<br/>파일 저장]
        O[Monad Testnet<br/>블록체인]
    end

    A --> B
    A --> C
    A --> D
    B --> G
    C --> E
    D --> F
    G --> E
    G --> F
    G --> H
    G --> I
    G --> J
    F --> H
    I --> N
    K --> L
    K --> M
    B --> K
    K --> O
```

---

## 컴포넌트 의존성 그래프

```mermaid
graph LR
    subgraph "Frontend Components"
        A[page.tsx]
        B[MintButton.tsx]
        C[TraitPreview.tsx]
        D[SkinRenderer3D.tsx]
    end

    subgraph "Core Libraries"
        E[mintPipeline.ts]
        F[traitGenerator.ts]
        G[skinRenderer.ts]
        H[gifGenerator.ts]
        I[ipfs.ts]
        J[metadata.ts]
        K[contractABI.ts]
    end

    subgraph "Types & Utils"
        L[types/index.ts]
        M[utils/metadata.ts]
        N[traitStyles.ts]
    end

    subgraph "Web3 Integration"
        O[wagmi.ts]
        P[chains.ts]
    end

    A -->|uses| B
    A -->|uses| C
    A -->|uses| D
    A -->|uses| F

    B -->|executes| E
    B -->|calls| K

    C -->|displays| F

    D -->|renders| G

    E -->|orchestrates| F
    E -->|orchestrates| G
    E -->|orchestrates| H
    E -->|orchestrates| I
    E -->|orchestrates| J

    F -->|depends on| L
    G -->|depends on| F
    G -->|depends on| N
    H -->|depends on| G
    J -->|depends on| F
    J -->|depends on| L
    M -->|extends| J

    B -->|uses| O
    O -->|uses| P
    O -->|uses| K
```

---

## 민팅 프로세스 플로우

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant Pipeline as mintPipeline
    participant Trait as traitGenerator
    participant Renderer as skinRenderer
    participant GIF as gifGenerator
    participant IPFS as IPFS/Pinata
    participant Contract as Smart Contract
    participant Chainlink as Price Feeds

    User->>UI: 지갑 연결
    UI->>Contract: previewMint(address)
    Contract->>Chainlink: 가격 조회 (ETH/USDT/USDC)
    Chainlink-->>Contract: 현재 가격 반환
    Contract->>Contract: 자산 가치 계산
    Contract->>Contract: Wealth Tier 결정
    Contract-->>UI: 미리보기 데이터

    UI->>Trait: generateTraits(address)
    Trait-->>UI: SkinTraits 반환
    UI->>Renderer: 3D 렌더링
    Renderer-->>UI: 3D 모델 표시

    User->>UI: 민팅 버튼 클릭

    UI->>Pipeline: executeMintPipeline()

    Pipeline->>Trait: generateTraits(address)
    Trait-->>Pipeline: SkinTraits

    Pipeline->>Renderer: createSkinTexture(traits)
    Renderer-->>Pipeline: 텍스처 캔버스

    Pipeline->>Renderer: createMinecraftScene()
    Renderer-->>Pipeline: 3D Scene

    Pipeline->>Renderer: captureAnimationFrames()
    Renderer-->>Pipeline: 60 프레임

    Pipeline->>GIF: generateGIF(frames)
    GIF-->>Pipeline: GIF Blob

    Pipeline->>IPFS: uploadGIFToIPFS(blob)
    IPFS-->>Pipeline: GIF CID

    Pipeline->>Pipeline: generateMetadata()
    Pipeline->>IPFS: uploadMetadataToIPFS()
    IPFS-->>Pipeline: Metadata CID

    Pipeline-->>UI: metadataUri

    UI->>Contract: mint(metadataUri)
    Contract->>Contract: 자산 스냅샷 저장
    Contract->>Contract: NFT 발행
    Contract-->>UI: 트랜잭션 해시

    UI-->>User: 민팅 완료!
```

---

## 데이터 흐름도

```mermaid
flowchart TD
    A[사용자 주소<br/>0x...] --> B{TraitGenerator}

    B -->|Bytes 0-3| C[Hat Traits]
    B -->|Bytes 4-7| D[Clothes Traits]
    B -->|Bytes 8-11| E[Shoes Traits]
    B -->|Bytes 12-15| F[Pants Traits]
    B -->|Bytes 16-19| G[Skin Traits]

    C --> H[SkinTraits Object]
    D --> H
    E --> H
    F --> H
    G --> H

    A --> I{Chainlink Price Feeds}
    I -->|ETH/USD| J[자산 가치 계산]
    I -->|USDT/USD| J
    I -->|USDC/USD| J

    J --> K{Wealth Tier<br/>결정}
    K -->|Tier 0-5| L[Special Item<br/>할당]

    H --> M[skinRenderer.ts]
    M --> N[64x64 텍스처<br/>생성]
    N --> O[Three.js<br/>3D 모델]
    O --> P[60 프레임<br/>캡처]
    P --> Q[GIF 생성<br/>512x512]

    Q --> R[IPFS 업로드]
    H --> S[메타데이터 생성]
    L --> S
    K --> S
    S --> R

    R --> T[ipfs:// URI]
    T --> U[Smart Contract<br/>mint 호출]
    U --> V[NFT 발행]
```

---

## 스마트 컨트랙트 구조

```mermaid
classDiagram
    class MinecraftPFPWithWealth {
        +AggregatorV3Interface ethUsdPriceFeed
        +AggregatorV3Interface usdtUsdPriceFeed
        +AggregatorV3Interface usdcUsdPriceFeed
        +address USDT
        +address USDC
        +mapping ownerToToken
        +mapping mintSnapshots

        +mint(ipfsUri) uint256
        +previewMint(owner) PreviewData
        +getTokenInfo(tokenId) TokenInfo
        +calculateTotalWealth(owner) WealthData
        +getWealthTier(totalValueUSD) uint8
        +getSpecialItemFromWealth(tier, owner) uint8
        +updateTokenURI(tokenId, newUri)
    }

    class TraitGenerator {
        <<library>>
        +generateTraits(address) SkinTraits
        +getColorFamily(segment) uint8
    }

    class ERC721URIStorage {
        <<OpenZeppelin>>
        +tokenURI(tokenId) string
        +_setTokenURI(tokenId, uri)
    }

    class Ownable {
        <<OpenZeppelin>>
        +owner() address
        +transferOwnership(newOwner)
    }

    class AggregatorV3Interface {
        <<Chainlink>>
        +latestRoundData() RoundData
    }

    MinecraftPFPWithWealth --|> ERC721URIStorage
    MinecraftPFPWithWealth --|> Ownable
    MinecraftPFPWithWealth ..> TraitGenerator : uses
    MinecraftPFPWithWealth ..> AggregatorV3Interface : depends on
```

---

## 트레잇 생성 알고리즘

```mermaid
flowchart LR
    A[Ethereum Address<br/>20 bytes] --> B{Segment 분할}

    B -->|Bytes 0-3| C[Segment 1<br/>모자]
    B -->|Bytes 4-7| D[Segment 2<br/>옷]
    B -->|Bytes 8-11| E[Segment 3<br/>신발]
    B -->|Bytes 12-15| F[Segment 4<br/>바지]
    B -->|Bytes 16-19| G[Segment 5<br/>피부]

    C --> H[Style = seg1 % 10<br/>Color = getColorFamily<br/>Opacity = seg1 >> 8 % 156 + 100]
    D --> I[Style = seg2 % 15<br/>Color = getColorFamily<br/>Opacity = seg2 >> 8 % 156 + 100]
    E --> J[Style = seg3 % 8<br/>Color = getColorFamily<br/>Opacity = seg3 >> 8 % 156 + 100]
    F --> K[Style = seg4 % 12<br/>Color = getColorFamily<br/>Opacity = seg4 >> 8 % 156 + 100]
    G --> L[Tone = seg5 % 6<br/>Shade = seg5 >> 8 % 50]

    H --> M[SkinTraits]
    I --> M
    J --> M
    K --> M
    L --> M
```

---

## 자산 등급 시스템

```mermaid
graph TD
    A[사용자 자산] --> B{총 자산 USD 계산}

    B --> C[ETH Balance × ETH/USD Price]
    B --> D[USDT Balance × USDT/USD Price]
    B --> E[USDC Balance × USDC/USD Price]

    C --> F[Total Wealth USD]
    D --> F
    E --> F

    F --> G{Wealth Tier<br/>결정}

    G -->|>= $500,000| H[Diamond Tier 5<br/>Special Items 15-19]
    G -->|>= $100,000| I[Platinum Tier 4<br/>Special Items 11-14]
    G -->|>= $50,000| J[Gold Tier 3<br/>Special Items 7-10]
    G -->|>= $10,000| K[Silver Tier 2<br/>Special Items 4-6]
    G -->|>= $1,000| L[Bronze Tier 1<br/>Special Items 1-3]
    G -->|< $1,000| M[None Tier 0<br/>No Special Item]
```

---

## 파일 구조

```
minecraft-pfp/
├── contracts/                      # 스마트 컨트랙트
│   ├── MinecraftPFPWithWealth.sol  # 메인 NFT 컨트랙트
│   └── TraitGenerator.sol          # 트레잇 생성 라이브러리
│
├── scripts/                        # 배포 스크립트
│   └── deploy.ts                   # 컨트랙트 배포 스크립트
│
├── src/
│   ├── app/                        # Next.js 앱 라우터
│   │   ├── page.tsx                # 메인 페이지
│   │   ├── layout.tsx              # 레이아웃
│   │   └── providers.tsx           # Web3 프로바이더 설정
│   │
│   ├── components/                 # React 컴포넌트
│   │   ├── MintButton.tsx          # 민팅 버튼 컴포넌트
│   │   ├── TraitPreview.tsx        # 트레잇 미리보기
│   │   └── SkinRenderer3D.tsx      # 3D 렌더러 컴포넌트
│   │
│   ├── lib/                        # 핵심 라이브러리
│   │   ├── traitGenerator.ts       # 주소 기반 트레잇 생성
│   │   ├── skinRenderer.ts         # 3D 모델 렌더링
│   │   ├── mintPipeline.ts         # 민팅 프로세스 관리
│   │   ├── gifGenerator.ts         # GIF 생성
│   │   ├── ipfs.ts                 # IPFS 업로드
│   │   ├── traitStyles.ts          # 트레잇 스타일 정의
│   │   ├── contractABI.ts          # 컨트랙트 ABI
│   │   ├── wagmi.ts                # Wagmi 설정
│   │   └── chains.ts               # 체인 설정
│   │
│   ├── types/                      # TypeScript 타입 정의
│   │   └── index.ts                # 공통 타입
│   │
│   ├── utils/                      # 유틸리티 함수
│   │   └── metadata.ts             # 메타데이터 생성
│   │
│   └── config/                     # 설정 파일
│       └── monad.ts                # Monad 네트워크 설정
│
├── test/                           # 테스트
│   └── MinecraftPFP.test.ts        # 컨트랙트 테스트
│
├── hardhat.config.ts               # Hardhat 설정
├── package.json                    # 패키지 의존성
└── tsconfig.json                   # TypeScript 설정
```

---

## 핵심 모듈 상세

### 1. traitGenerator.ts

**목적**: Ethereum 주소를 20바이트로 나누어 각 부위의 트레잇을 결정론적으로 생성

**주요 함수**:
- `generateTraits(address)`: 주소로부터 전체 트레잇 생성
- `getColorFamily(segment)`: 세그먼트 값으로 색상 계열 결정
- `validateTraits(traits)`: 트레잇 유효성 검증

**의존성**:
- 없음 (순수 함수)

**호출자**:
- `page.tsx`: 미리보기용
- `mintPipeline.ts`: 민팅 시
- `TraitPreview.tsx`: UI 표시

---

### 2. skinRenderer.ts

**목적**: Three.js를 사용하여 마인크래프트 스킨 텍스처 생성 및 3D 렌더링

**주요 함수**:
- `createSkinTexture(traits)`: 64x64 텍스처 캔버스 생성
- `createMinecraftScene()`: Three.js 씬, 카메라, 렌더러 설정
- `captureAnimationFrames()`: 360도 회전 애니메이션 프레임 캡처
- `disposeScene()`: 메모리 정리

**의존성**:
- `three`: 3D 렌더링
- `traitGenerator`: 트레잇 데이터
- `traitStyles`: 색상 스타일

**호출자**:
- `mintPipeline.ts`: GIF 생성용
- `SkinRenderer3D.tsx`: 실시간 미리보기

---

### 3. mintPipeline.ts

**목적**: 전체 민팅 프로세스를 순차적으로 실행하는 오케스트레이터

**주요 함수**:
- `executeMintPipeline(options)`: 전체 민팅 파이프라인 실행
  1. 트레잇 생성
  2. 스킨 텍스처 생성
  3. 3D 씬 설정
  4. 애니메이션 프레임 캡처
  5. GIF 생성
  6. GIF IPFS 업로드
  7. 메타데이터 생성
  8. 메타데이터 IPFS 업로드
  9. 리소스 정리
- `executePreviewPipeline(address)`: 미리보기용 간소화 버전

**의존성**:
- `traitGenerator`: 트레잇 생성
- `skinRenderer`: 3D 렌더링
- `gifGenerator`: GIF 인코딩
- `ipfs`: IPFS 업로드
- `metadata`: 메타데이터 생성

**호출자**:
- `MintButton.tsx`: 민팅 버튼 클릭 시

---

### 4. gifGenerator.ts

**목적**: 캡처된 프레임들을 GIF로 인코딩

**주요 함수**:
- `generateGIF(frames, width, height, fps)`: ImageData 배열을 GIF Blob으로 변환
- `blobToArrayBuffer(blob)`: Blob을 ArrayBuffer로 변환
- `blobToBase64(blob)`: Blob을 Base64로 변환

**의존성**:
- `gif.js`: GIF 인코딩 라이브러리

**호출자**:
- `mintPipeline.ts`: 민팅 프로세스 중

---

### 5. ipfs.ts

**목적**: Pinata를 통한 IPFS 업로드 및 조회

**주요 함수**:
- `createPinataClient()`: Pinata SDK 인스턴스 생성
- `uploadGIFToIPFS(blob, filename)`: GIF 파일 업로드
- `uploadMetadataToIPFS(metadata)`: 메타데이터 JSON 업로드
- `getIPFSUrl(cid)`: HTTP 게이트웨이 URL 생성
- `getIPFSUri(cid)`: ipfs:// URI 생성

**의존성**:
- `pinata-web3`: Pinata SDK
- 환경변수: `NEXT_PUBLIC_PINATA_JWT`, `NEXT_PUBLIC_PINATA_GATEWAY`

**호출자**:
- `mintPipeline.ts`: GIF 및 메타데이터 업로드

---

### 6. MinecraftPFPWithWealth.sol

**목적**: ERC721 NFT 컨트랙트 + 자산 기반 특별 아이템

**주요 기능**:
- `mint(ipfsUri)`: NFT 발행 및 자산 스냅샷 저장
- `previewMint(owner)`: 민팅 전 미리보기 데이터
- `calculateTotalWealth(owner)`: ETH, USDT, USDC 자산 가치 계산
- `getWealthTier(totalValueUSD)`: 자산 등급 결정
- `getSpecialItemFromWealth(tier, owner)`: 특별 아이템 ID 생성
- `getTokenInfo(tokenId)`: 토큰 전체 정보 조회
- `updateTokenURI(tokenId, newUri)`: URI 업데이트

**의존성**:
- `@openzeppelin/contracts`: ERC721URIStorage, Ownable
- `@chainlink/contracts`: AggregatorV3Interface
- `TraitGenerator.sol`: 트레잇 생성 라이브러리

**외부 서비스**:
- Chainlink Price Feeds (ETH/USD, USDT/USD, USDC/USD)
- USDT, USDC 토큰 컨트랙트

---

### 7. TraitGenerator.sol

**목적**: 주소 기반 결정론적 트레잇 생성 (온체인)

**주요 기능**:
- `generateTraits(address)`: 주소를 5개 세그먼트로 나누어 트레잇 생성
- `getColorFamily(segment)`: 나눗셈 체크를 통한 색상 계열 결정

**특징**:
- Library로 구현 (MinecraftPFPWithWealth에서 using으로 사용)
- 순수 함수 (pure)
- Gas 효율적인 비트 연산 사용

---

## 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js + @react-three/fiber
- **State Management**: React Hooks

### Web3
- **Wallet Connection**: RainbowKit 2.0
- **Contract Interaction**: Wagmi 2.0, Viem 2.0
- **Blockchain**: Monad Testnet (EVM-compatible)

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin Contracts 5.0
- **Oracle**: Chainlink Price Feeds

### Storage
- **Decentralized Storage**: IPFS
- **Provider**: Pinata

### Media Processing
- **Image Processing**: Canvas API
- **GIF Encoding**: gif.js
- **3D Graphics**: Three.js

---

## 환경 변수

```env
# Blockchain
PRIVATE_KEY=                        # 배포자 개인 키
MONAD_TESTNET_RPC_URL=              # Monad Testnet RPC
SEPOLIA_RPC_URL=                    # Sepolia RPC (테스트용)
MAINNET_RPC_URL=                    # Mainnet RPC (프로덕션)

# Contract Verification
MONAD_API_KEY=                      # Monad Explorer API 키
ETHERSCAN_API_KEY=                  # Etherscan API 키

# IPFS
NEXT_PUBLIC_PINATA_JWT=             # Pinata JWT 토큰
NEXT_PUBLIC_PINATA_GATEWAY=         # Pinata 게이트웨이 URL

# Deployed Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=       # 배포된 컨트랙트 주소
```

---

## 배포 프로세스

```mermaid
flowchart TD
    A[개발 완료] --> B[컨트랙트 컴파일]
    B --> C[테스트 실행]
    C --> D{테스트 통과?}
    D -->|No| E[버그 수정]
    E --> C
    D -->|Yes| F[Monad Testnet 배포]
    F --> G[배포 정보 저장<br/>deployments/*.json]
    G --> H[컨트랙트 검증]
    H --> I[.env 업데이트<br/>CONTRACT_ADDRESS]
    I --> J[프론트엔드 빌드]
    J --> K[Next.js 배포]
    K --> L[통합 테스트]
    L --> M{정상 작동?}
    M -->|No| N[문제 해결]
    N --> L
    M -->|Yes| O[프로덕션 배포]
```

---

## 보안 고려사항

### 스마트 컨트랙트
1. **Price Feed 검증**
   - Chainlink Price Feed의 freshness 체크 (1시간 이내)
   - 가격이 0보다 큰지 검증

2. **중복 민팅 방지**
   - `ownerToToken` 매핑으로 주소당 1개만 민팅 가능
   - 민팅 전 체크: `require(ownerToToken[msg.sender] == 0)`

3. **입력 검증**
   - IPFS URI 비어있지 않은지 확인
   - 토큰 존재 여부 확인

### 프론트엔드
1. **API 키 보호**
   - `NEXT_PUBLIC_` 접두사로 클라이언트 노출 제어
   - 민감한 키는 서버 사이드에서만 사용

2. **트랜잭션 안전성**
   - wagmi의 `useWaitForTransactionReceipt`로 트랜잭션 확인
   - 에러 처리 및 사용자 피드백

---

## 성능 최적화

### 3D 렌더링
- WebGL 렌더러 사용
- 필요한 경우에만 리소스 할당
- `disposeScene`으로 메모리 정리

### GIF 생성
- Web Worker 사용 (gif.js)
- 프레임 수 조정 가능 (기본 60프레임)

### IPFS 업로드
- 병렬 업로드 불가능 (순차 처리)
- 진행 상황 사용자에게 표시

---

## 향후 개선 사항

1. **특별 아이템 3D 렌더링**
   - 현재는 메타데이터에만 포함
   - 실제 3D 모델에 아이템 표시

2. **배치 민팅**
   - 현재는 주소당 1개
   - 여러 개 민팅 기능 추가 가능

3. **메타데이터 업데이트**
   - 사용자가 자산 증가 시 특별 아이템 업그레이드
   - `updateTokenURI` 기능 활용

4. **성능 모니터링**
   - GIF 생성 시간 추적
   - IPFS 업로드 시간 추적
   - 트랜잭션 가스비 최적화

---

## 참고 자료

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [Three.js Documentation](https://threejs.org/docs/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Monad Documentation](https://docs.monad.xyz/)

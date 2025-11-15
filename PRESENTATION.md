---
theme: default
background: https://source.unsplash.com/collection/94734566/1920x1080
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Minecraft PFP NFT
  AI + Chainlink로 만드는 재미있는 크로스체인 NFT
drawings:
  persist: false
transition: slide-left
title: Minecraft PFP NFT
mdc: true
aspectRatio: '16/9'
canvasWidth: 980
---

# 🎮 Minecraft PFP NFT
## AI + Chainlink로 만드는 재미있는 크로스체인 NFT

**Monad Blitz Hackathon 2025**

---

## 🎯 한 줄 요약

> "당신의 지갑 주소로 생성된 고유한 Minecraft 캐릭터 NFT에,
> **Chainlink CCIP**로 다른 체인의 NFT를 검증하면 **황금 왕관**을 씌워드립니다!"

---

## 💡 프로젝트 배경

### 기존 PFP NFT의 문제점
- ❌ 랜덤 생성 → 동일 지갑으로 다른 NFT 발행 가능
- ❌ 단일 체인에 갇힌 정체성
- ❌ 정적인 메타데이터

### 우리의 솔루션
- ✅ **결정론적 생성**: 같은 주소 = 같은 캐릭터
- ✅ **크로스체인 검증**: Chainlink CCIP로 다른 체인 자산 증명
- ✅ **동적 특전**: 자산 등급에 따른 특별 아이템

---

## 🏗️ 아키텍처 개요

```
┌─────────────────┐
│  Sepolia NFT    │
│  (Any ERC721)   │
└────────┬────────┘
         │ 소유권 검증
         ▼
┌─────────────────────────┐
│ NFTOwnershipVerifier    │ ◄─── Chainlink CCIP 발신
│ (Sepolia)               │
└────────┬────────────────┘
         │ CCIP Message
         ▼
┌─────────────────────────┐
│ Chainlink CCIP Router   │ ◄─── 크로스체인 메시징
│ (Decentralized Oracle) │
└────────┬────────────────┘
         │ ccipReceive()
         ▼
┌─────────────────────────┐
│ MonadCCIPReceiver       │ ◄─── attestation 기록
│ (Monad Testnet)         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ AI Skin Generator       │ ◄─── Golden Crown 렌더링
│ (Claude Haiku 4.5)      │
└─────────────────────────┘
```

---

## ⭐ 핵심 기능 #1: Chainlink Data Feeds

### 자산 기반 Wealth Tier 시스템

**문제**: NFT에 사용자의 "부"를 어떻게 반영할까?

**해결**: Chainlink Price Feeds로 실시간 자산 가치 계산!

```solidity
// ETH, USDT, USDC 잔액을 USD로 환산
function calculateTotalWealth(address owner) public view returns (
    uint256 ethBalance,
    uint256 usdtBalance,
    uint256 usdcBalance,
    uint256 totalValueUSD
) {
    // Chainlink Price Feed 조회
    (, int256 ethPrice,,,) = ethUsdPriceFeed.latestRoundData();
    (, int256 usdtPrice,,,) = usdtUsdPriceFeed.latestRoundData();

    // USD 가치 계산
    totalValueUSD = (ethBalance * ethPrice) +
                    (usdtBalance * usdtPrice) + ...;
}
```

**Wealth Tier에 따른 특별 아이템 부여**
- 💎 Diamond ($500K+): Elytra, Netherite Armor
- 🥇 Platinum ($100K+): Diamond Sword, Enchanted Bow
- 🥈 Gold ($50K+): Iron Armor, Golden Apple
- 🥉 Silver ($10K+): Bow, Shield

---

## ⭐ 핵심 기능 #2: Chainlink CCIP 🌟

### 크로스체인 NFT 검증 → Golden Crown

**시나리오**:
"저는 Sepolia에 NFT를 가지고 있어요. Monad에서도 인정받고 싶어요!"

---

### CCIP 아키텍처 개요

<div style="transform: scale(0.8); transform-origin: top center; width: 125%; margin-left: -12.5%;">

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'14px'}}}%%
graph LR
    subgraph "Source Chain - Sepolia"
        A[User Wallet<br/>NFT 소유자]
        B[Any ERC721 NFT<br/>예: Bored Ape]
        C[NFTOwnershipVerifier<br/>검증 컨트랙트]
        D[Sepolia CCIP Router<br/>0x0BF3dE8c...]
    end

    subgraph "Chainlink Network"
        E[CCIP Oracle Network<br/>탈중앙화 검증]
        F[Risk Management<br/>보안 레이어]
    end

    subgraph "Destination Chain - Monad"
        G[Monad CCIP Router]
        H[MonadCCIPReceiver<br/>수신 컨트랙트]
        I[Attestation Storage<br/>mapping address → bool]
        J[AI Skin Generator<br/>Golden Crown]
    end

    A -->|1. verifyAndSend| C
    B -.->|소유권 확인| C
    C -->|2. ccipSend| D
    D -->|3. 메시지 전달| E
    E -->|4. 검증| F
    F -->|5. 안전 확인| G
    G -->|6. ccipReceive| H
    H -->|7. attestation 저장| I
    I -.->|8. 확인| J
    J -->|9. Golden Crown 렌더링| A

    style E fill:#f9d71c,stroke:#333,stroke-width:3px
    style F fill:#f9d71c,stroke:#333,stroke-width:3px
    style J fill:#ffd700,stroke:#333,stroke-width:2px
```

</div>

---

### CCIP 워크플로우

#### Step 1: Sepolia에서 검증 요청
```solidity
// NFTOwnershipVerifier.sol (Sepolia)
function verifyAndSend(address nftContract, address monadAddress) external {
    // 1. NFT 소유권 확인
    require(IERC721(nftContract).balanceOf(msg.sender) > 0);

    // 2. CCIP 메시지 구성
    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
        receiver: abi.encode(monadReceiverAddress),
        data: abi.encode(monadAddress),  // 인증할 주소
        tokenAmounts: new Client.EVMTokenAmount[](0),
        feeToken: linkToken,
        extraArgs: ""
    });

    // 3. CCIP Router로 전송
    bytes32 messageId = IRouterClient(ccipRouter).ccipSend(
        monadChainSelector,
        message
    );
}
```

#### Step 2: Monad에서 attestation 기록
```solidity
// MonadCCIPReceiver.sol (Monad)
function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
    address monadAddress = abi.decode(message.data, (address));

    // attestation 저장
    attestations[monadAddress] = true;
    attestationTimestamps[monadAddress] = block.timestamp;

    emit AttestationRecorded(monadAddress);
}
```

#### Step 3: AI 스킨 생성 시 Golden Crown 부여
```typescript
// AI Skin Generator
const hasCCIPAttestation = await contract.hasAttestation(address);

if (hasCCIPAttestation) {
    renderGoldenCrown(canvas);  // ✨ 황금 왕관 렌더링
}
```

---

### CCIP 메시지 전달 과정 (시퀀스)

<div style="transform: scale(0.75); transform-origin: top center; width: 133%; margin-left: -16.5%;">

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'12px'}}}%%
sequenceDiagram
    actor User
    participant Sepolia as NFTOwnershipVerifier<br/>(Sepolia)
    participant SRouter as Sepolia CCIP Router
    participant Oracle as Chainlink Oracle Network
    participant Risk as Risk Management Network
    participant MRouter as Monad CCIP Router
    participant Monad as MonadCCIPReceiver<br/>(Monad)
    participant AI as AI Skin Generator

    User->>Sepolia: 1. verifyAndSend(nftContract, monadAddress)
    Sepolia->>Sepolia: 2. NFT 소유권 확인 ✓
    Sepolia->>SRouter: 3. ccipSend(message)
    Note over SRouter: LINK 토큰으로<br/>수수료 결제

    SRouter->>Oracle: 4. 메시지 전송 요청
    Oracle->>Oracle: 5. 탈중앙화 검증
    Oracle->>Risk: 6. 보안 검사 요청
    Risk->>Risk: 7. 이상 거래 감지
    Risk-->>Oracle: 8. 승인 ✓

    Oracle->>MRouter: 9. 크로스체인 메시지
    MRouter->>Monad: 10. ccipReceive(message)
    Monad->>Monad: 11. attestation[monadAddress] = true

    User->>AI: 12. 스킨 생성 요청
    AI->>Monad: 13. hasAttestation(address)?
    Monad-->>AI: 14. true ✓
    AI->>AI: 15. renderGoldenCrown()
    AI-->>User: 16. 황금 왕관 스킨 반환 👑

    rect rgb(249, 215, 28, 0.1)
        Note over Oracle,Risk: Chainlink CCIP<br/>탈중앙화 검증
    end

    rect rgb(255, 215, 0, 0.1)
        Note over AI: Golden Crown<br/>특전 부여
    end
```

</div>

---

### CCIP 상태 변화

<div style="transform: scale(0.85); transform-origin: top center; width: 118%; margin-left: -9%;">

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'13px'}}}%%
stateDiagram-v2
    [*] --> NoAttestation: 초기 상태

    NoAttestation --> VerificationRequested: User가 Sepolia에서<br/>verifyAndSend() 호출

    VerificationRequested --> MessageSent: NFT 소유권 확인 ✓<br/>CCIP 메시지 전송

    MessageSent --> OracleProcessing: Chainlink Oracle<br/>네트워크 처리 중

    OracleProcessing --> RiskManagement: 메시지 검증 완료

    RiskManagement --> MessageDelivered: 보안 검사 통과 ✓<br/>Monad로 전달

    MessageDelivered --> AttestationRecorded: MonadCCIPReceiver가<br/>attestation 저장

    AttestationRecorded --> GoldenCrownEnabled: AI 스킨 생성 시<br/>Golden Crown 렌더링

    GoldenCrownEnabled --> [*]: NFT 민팅 완료 👑

    note right of OracleProcessing
        Chainlink CCIP의 핵심:
        - 탈중앙화된 검증
        - Risk Management로 이중 보안
        - 체인 간 신뢰 보장
    end note

    note right of GoldenCrownEnabled
        크로스체인 정체성 증명:
        - Sepolia NFT 소유 → Monad에서 인정
        - 영구적인 특전 (Golden Crown)
        - 다른 체인 확장 가능
    end note
```

</div>

---

## 🎨 AI 스킨 생성 파이프라인

### 결정론적 Trait → AI 프롬프트 → 픽셀 아트

```typescript
// 1. 주소 → Trait 생성 (결정론적)
const traits = generateTraits("0x1234...");
// { hatStyle: 3, clothesColor: "BLUE", skinTone: 2, ... }

// 2. Trait → AI 프롬프트
const prompt = `Design a Minecraft character with:
- Blue hoodie, red sneakers, tan skin tone
- Pixelated, retro game aesthetics
- 3D depth with highlights and shadows`;

// 3. Claude API → 색상 스킴 생성
const colorScheme = await generateColorScheme(prompt);
// { head: { skin: "#D4A373", eyes: "#2C3E50" }, ... }

// 4. 64x64 Canvas 렌더링 (디더링 효과)
const skinTexture = renderSkinFromColorScheme(colorScheme);
```

**Supabase 캐싱**: 동일 주소 재요청 시 DB에서 즉시 반환

---

## 🔗 Chainlink 통합 하이라이트

### 1. **Data Feeds** (자산 가치 계산)
- **ETH/USD**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- **USDT/USD**: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`
- **사용 사례**: 민팅 시점의 자산 스냅샷 저장

### 2. **CCIP** (크로스체인 메시징) ⭐
- **Sepolia Router**: `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`
- **Monad Selector**: `16015286601757825753`
- **사용 사례**: Sepolia NFT 소유 증명 → Monad에서 Golden Crown 획득

---

## 🎮 데모 시연

### 시나리오: "Alice의 NFT 여정"

```mermaid
journey
    title Alice의 크로스체인 NFT 민팅 여정
    section 지갑 연결
      지갑 연결: 5: Alice
      Trait 자동 생성: 5: System
      파란 모자, 빨간 신발: 4: Alice
    section AI 스킨 생성
      API 호출: 5: Alice
      Claude AI 생성: 5: System
      Supabase 캐싱: 4: System
    section Wealth Tier
      Chainlink Price Feeds: 5: System
      자산 $75K → Gold Tier: 5: Alice
      Diamond Sword 획득: 5: Alice
    section CCIP 검증
      Sepolia NFT 확인: 5: Alice
      CCIP 메시지 전송: 5: System
      Monad에서 수신: 5: System
      Golden Crown 획득: 5: Alice
    section 민팅
      NFT 발행: 5: Alice
      완벽한 캐릭터 완성: 5: Alice
```

### 단계별 상세

1. **Alice, 지갑 연결** (`0xAlice...`)
   - Trait 자동 생성: 파란 모자, 빨간 신발, 황갈색 피부

2. **AI 스킨 생성 API 호출**
   ```
   GET /api/skin/0xAlice...
   → Claude가 픽셀 아트 생성
   → Supabase에 캐싱
   ```

3. **Wealth Tier 확인**
   - Chainlink Price Feeds로 자산 조회
   - Alice = $75,000 → **Gold Tier** → Diamond Sword 획득

4. **CCIP 검증 (선택)**
   - Sepolia에 Bored Ape NFT 소유
   - NFTOwnershipVerifier로 검증 요청
   - CCIP 메시지 → Monad
   - **Golden Crown** 획득! 👑

5. **민팅 완료**
   - 스킨 + Wealth Tier + CCIP Crown 모두 반영된 NFT 발행

---

## 🛠️ 기술 스택

### Smart Contracts
- **Solidity 0.8.20** + Hardhat
- **OpenZeppelin ERC721** (NFT 표준)
- **Chainlink Contracts** (Data Feeds + CCIP)

### Frontend & AI
- **Next.js 14** (App Router, API Routes)
- **Anthropic Claude Haiku 4.5** (AI 스킨 생성)
- **Supabase** (PostgreSQL 캐싱)
- **skinview3d** (Minecraft 3D 뷰어)

### Web3
- **Wagmi + RainbowKit** (지갑 연결)
- **Viem** (컨트랙트 상호작용)

---

## 📊 CCIP의 가치: 왜 중요한가?

### 기존 방식 vs CCIP 비교

```mermaid
graph LR
    subgraph "기존 중앙화 브릿지"
        A1[Chain A] -->|메시지| B1[중앙 서버<br/>⚠️ 단일 장애점]
        B1 -->|메시지| C1[Chain B]
        style B1 fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    end

    subgraph "Chainlink CCIP"
        A2[Chain A] -->|메시지| B2[Oracle Network<br/>✓ 탈중앙화]
        B2 -->|검증| D2[Risk Management<br/>✓ 이중 보안]
        D2 -->|승인| C2[Chain B]
        style B2 fill:#f9d71c,stroke:#333,stroke-width:2px
        style D2 fill:#51cf66,stroke:#333,stroke-width:2px
    end
```

| 항목 | 기존 브릿지 | Chainlink CCIP |
|------|------------|----------------|
| **중앙화** | ❌ 중앙 서버 의존 | ✅ 탈중앙화 오라클 네트워크 |
| **보안** | ⚠️ 해킹 위험 높음 | ✅ Risk Management 이중 검증 |
| **표준화** | ❌ 체인마다 다른 방식 | ✅ 통일된 인터페이스 |
| **확장성** | ⚠️ 체인 추가 시 재개발 | ✅ 플러그앤플레이 |
| **신뢰** | ❌ 운영자 신뢰 필요 | ✅ 코드로 검증 가능 |

### 우리 프로젝트에서의 활용

```mermaid
mindmap
  root((Chainlink CCIP<br/>활용))
    크로스체인 정체성
      Sepolia NFT 증명
      Monad에서 인정
      Golden Crown 특전
    확장 가능성
      Polygon 통합
      Arbitrum 통합
      Base 통합
    보안 보장
      탈중앙화 검증
      Risk Management
      위변조 방지
    사용자 경험
      단일 트랜잭션
      자동 처리
      투명한 추적
```

> "Sepolia의 NFT 소유권을 **안전하게** Monad에 증명하여,
> 크로스체인 정체성(Identity)을 구축합니다."

---

## 🎯 핵심 기술적 성과

### 1. **Chainlink CCIP 크로스체인 검증**
- Sepolia → Monad 메시지 전송 성공
- attestation 기반 특전 시스템 구현

### 2. **Chainlink Data Feeds 실시간 통합**
- 3개 토큰(ETH/USDT/USDC) 가격 조회
- 동적 Wealth Tier 계산

### 3. **AI + Blockchain 결합**
- 결정론적 Trait → AI 픽셀 아트 파이프라인
- 64x64 UV 매핑 정확도

### 4. **효율적인 캐싱 시스템**
- Supabase로 AI 생성 비용 절감
- 동일 주소 재요청 시 즉시 반환

---

## 🚀 향후 계획

```mermaid
timeline
    title 프로젝트 로드맵
    section Q1 2025
        더 많은 체인 통합 : Polygon
                            : Arbitrum
                            : Base
        메타데이터 업데이트 : 동적 NFT
        커뮤니티 기능 : 스킨 갤러리
    section Q2 2025
        DAO 거버넌스 : 특별 아이템 투표
        P2E 게임 통합 : Minecraft 서버 연동
        멀티체인 Inventory : CCIP 기반 아이템 관리
    section Q3-Q4 2025
        Chainlink Functions : AI 스킨 자동 업데이트
        NFT Rental/Lending : CCIP 크로스체인 대여
        메인넷 출시 : Monad Mainnet 마이그레이션
```

### 단기 (1-2개월)
- [ ] 더 많은 체인 CCIP 통합 (Polygon, Arbitrum)
- [ ] NFT 메타데이터 업데이트 기능
- [ ] 커뮤니티 스킨 갤러리

### 중기 (3-6개월)
- [ ] DAO 거버넌스 (특별 아이템 투표)
- [ ] P2E 게임 통합 (스킨을 게임에서 사용)
- [ ] CCIP를 활용한 멀티체인 Inventory 시스템

### 장기 (6개월+)
- [ ] Chainlink Functions로 동적 AI 스킨 업데이트
- [ ] CCIP 기반 NFT Rental/Lending 프로토콜

---

### CCIP 확장 계획

<div style="transform: scale(0.7); transform-origin: top center; width: 143%; margin-left: -21.5%;">

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'12px'}}}%%
graph LR
    subgraph V1["현재 (V1)"]
        S1[Sepolia Testnet]
        M1[Monad Testnet]
        S1 <-->|CCIP| M1
    end

    subgraph V2["단기 (V2)"]
        S2[Sepolia]
        M2[Monad]
        P2[Polygon]
        A2[Arbitrum]

        S2 <-->|CCIP| M2
        S2 <-->|CCIP| P2
        S2 <-->|CCIP| A2
        M2 <-->|CCIP| P2
        M2 <-->|CCIP| A2
    end

    subgraph V3["중기 (V3)"]
        S3[Sepolia]
        M3[Monad]
        P3[Polygon]
        A3[Arbitrum]
        B3[Base]
        O3[Optimism]

        S3 <-->|CCIP| M3
        S3 <-->|CCIP| P3
        S3 <-->|CCIP| A3
        S3 <-->|CCIP| B3
        S3 <-->|CCIP| O3
        M3 <-->|CCIP Hub| P3
        M3 <-->|CCIP Hub| A3
        M3 <-->|CCIP Hub| B3
        M3 <-->|CCIP Hub| O3
    end

    V1 --> V2
    V2 --> V3

    style M1 fill:#51cf66,stroke:#333
    style M2 fill:#51cf66,stroke:#333
    style M3 fill:#51cf66,stroke:#333
```

</div>

---

## 🏆 왜 이 프로젝트가 특별한가?

### 1. **Chainlink 생태계 완벽 활용**
- Data Feeds ✅
- CCIP ✅ (메인 하이라이트!)
- 향후 Functions 통합 예정

### 2. **실용적인 크로스체인 유틸리티**
- 단순 브릿지가 아닌, **정체성 증명**
- 다른 체인의 자산을 현재 체인에서 인정

### 3. **재미 + 기술의 균형**
- Minecraft 픽셀 아트로 친숙함
- 하지만 내부는 첨단 Web3 기술

### 4. **확장 가능한 아키텍처**
- 모듈화된 설계로 새로운 기능 추가 용이
- CCIP로 무한한 체인 통합 가능

---

## 📦 오픈소스 & 데모

### GitHub Repository
```
https://github.com/your-username/minecraft-pfp
```

### Live Demo
```
https://minecraft-pfp.vercel.app
```

### Deployed Contracts
- **Monad Testnet**: MinecraftPFP, MonadCCIPReceiver
- **Sepolia Testnet**: NFTOwnershipVerifier

### CCIP Explorer
```
Sepolia → Monad 메시지 확인:
https://ccip.chain.link
```

---

## 🙏 감사합니다!

### Contact
- **Team**: [Your Team Name]
- **Email**: your@email.com
- **Twitter**: @yourhandle

### Special Thanks
- **Chainlink** for incredible oracle infrastructure
- **Monad** for high-performance testnet
- **Anthropic** for Claude AI API

---

## 💬 Q&A

**예상 질문:**

**Q: CCIP 수수료는 어떻게 처리하나요?**
A: LINK 토큰으로 결제하며, 컨트랙트에 LINK를 예치합니다. 사용자는 검증 시 가스비만 부담합니다.

**Q: 다른 체인의 NFT도 검증 가능한가요?**
A: 네! ERC721 표준을 따르는 모든 NFT가 가능합니다. CCIP가 지원하는 체인이면 추가 가능합니다.

**Q: AI 스킨 생성 비용은?**
A: Claude Haiku 4.5는 요청당 ~$0.001 수준으로 매우 저렴하며, Supabase 캐싱으로 재생성을 방지합니다.

**Q: Monad 메인넷 출시 시 마이그레이션은?**
A: 테스트넷과 동일한 컨트랙트를 메인넷에 배포하며, CCIP 설정만 업데이트하면 됩니다.

---

## 🎉 Thank You!

### "Chainlink CCIP로 연결된 미래를 만듭니다"


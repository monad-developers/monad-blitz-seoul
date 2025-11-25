# CCIP 크로스체인 구현 - 완료 체크리스트 및 남은 작업

**날짜**: 2025-01-15
**상태**: Phase 4-8 완료 / 배포 및 설정 남음

---

## ✅ 완료된 구현

### Phase 4: 시각적 요소 (골든 크라운)
- ✅ `src/lib/aiSkinGenerator.ts`
  - `generateAISkin()` 함수에 `hasCCIPAttestation` 파라미터 추가
  - `renderGoldenCrown()` 함수 구현 (Head Overlay에 픽셀 아트 크라운)
  - Base64 이미지 재로드 후 크라운 추가 로직

- ✅ `src/lib/mintPipeline.ts`
  - `MintPipelineOptions` 인터페이스에 `hasCCIPAttestation?: boolean` 추가
  - 메타데이터 생성 시 CCIP 플래그 전달

- ✅ `src/utils/metadata.ts`
  - `generateMetadata()` 함수에 `hasCCIPAttestation` 파라미터 추가
  - CCIP 속성 자동 추가:
    - CCIP Verified: Yes
    - Cross-Chain NFT Holder: Ethereum Sepolia
    - Special Trait: Golden Crown
    - Rarity: Legendary
  - Description 자동 변경 (크로스체인 검증 설명)

### Phase 5: API 엔드포인트 실제 구현

- ✅ `src/app/api/ccip/check-sepolia-nft/route.ts`
  - Sepolia Public RPC로 NFT balanceOf 확인
  - ERC721 표준 사용
  - 에러 처리 및 상세 응답

- ✅ `src/app/api/ccip/record-message/route.ts`
  - Supabase DB에 CCIP attestation 기록
  - 필수 필드 검증
  - 7일 만료 시간 자동 설정
  - used=false 초기값

- ✅ `src/app/api/ccip/monitor/[messageId]/route.ts`
  - DB에서 CCIP 메시지 상태 조회
  - 진행률 계산 (pending: 25%, sent: 50%, confirmed: 75%, completed: 100%)
  - 예상 대기 시간 표시

- ✅ `src/app/api/ccip/attestation-status/[address]/route.ts`
  - Monad 컨트랙트에서 `hasValidAttestation()` 호출
  - 실패 시 false 반환 (배포 전 안전 처리)

### Phase 6: 메인 페이지 통합

- ✅ `src/app/page.tsx`
  - SepoliaNFTVerification 컴포넌트 import
  - CCIPStatusMonitor 컴포넌트 import
  - `hasAttestation`, `ccipMessageId` 상태 추가
  - Attestation 상태 확인 useEffect
  - CCIP 검증 UI 섹션 추가
  - 골든 크라운 획득 안내 메시지

### Phase 7: 환경 변수 설정

- ✅ `.env.example` 업데이트
  - Sepolia RPC URL (Public endpoint)
  - CCIP Router 주소 (Sepolia, Monad)
  - Chain Selector 값
  - NFT 컨트랙트 주소 (0x583aeA758A94d74bA997326634B23a2Ea6f4e005)
  - 배포 후 설정할 placeholder

### Phase 8: TypeScript 컴파일

- ✅ tsconfig.json 수정 (scripts 폴더 제외)
- ✅ 타입 체크 통과

---

## 🔧 남은 작업

### 1. Supabase 데이터베이스 마이그레이션 ⚠️ **필수**

**파일**: `src/lib/db/migrations/002_ccip_attestations.sql`
**상태**: 파일 존재, 실행 필요

**실행 방법**:
```bash
# Supabase CLI 사용
supabase db push

# 또는 SQL 직접 실행
psql -h <SUPABASE_HOST> -U postgres -d postgres -f src/lib/db/migrations/002_ccip_attestations.sql
```

**테이블 스키마**:
```sql
CREATE TABLE ccip_attestations (
    id SERIAL PRIMARY KEY,
    monad_address VARCHAR(42) NOT NULL,
    sepolia_nft_address VARCHAR(42) NOT NULL,
    sepolia_token_id VARCHAR(78),
    ccip_message_id VARCHAR(66) NOT NULL UNIQUE,
    attestation_id VARCHAR(66) NOT NULL,
    sepolia_tx_hash VARCHAR(66),
    monad_tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,

    INDEX idx_monad_address (monad_address),
    INDEX idx_ccip_message_id (ccip_message_id),
    INDEX idx_status (status)
);
```

**확인 방법**:
```sql
-- 테이블 존재 확인
SELECT * FROM information_schema.tables WHERE table_name = 'ccip_attestations';

-- 테이블 구조 확인
\d ccip_attestations
```

---

### 2. CCIP 컨트랙트 배포 ⚠️ **필수**

#### 2.1 Sepolia 배포

**스크립트**: `scripts/deploy-ccip.js`

**실행**:
```bash
npx hardhat run scripts/deploy-ccip.js --network sepolia
```

**환경 변수 필요**:
- `SEPOLIA_CCIP_ROUTER` ✅ (이미 설정: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59)
- `NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT` ✅ (이미 설정: 0x583aeA758A94d74bA997326634B23a2Ea6f4e005)
- `PRIVATE_KEY` ⚠️ (배포자 private key)

**배포 순서**:
1. NFTOwnershipVerifier 배포
2. supportedNFT에 0x583aeA758A94d74bA997326634B23a2Ea6f4e005 추가
3. 배포 정보 저장 (`deployments/ccip-sepolia.json`)

**배포 후**:
```bash
# .env.local에 추가
NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=<배포된_주소>
```

#### 2.2 Monad 배포

**전제 조건**:
- MinecraftPFPWithWealth 컨트랙트가 먼저 배포되어 있어야 함
- `NEXT_PUBLIC_CONTRACT_ADDRESS` 환경 변수 설정 필요

**실행**:
```bash
npx hardhat run scripts/deploy-ccip.js --network monad
```

**환경 변수 필요**:
- `NEXT_PUBLIC_MONAD_CCIP_ROUTER` ⚠️ (Monad CCIP Router 주소)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` ⚠️ (MinecraftPFP 주소)
- `PRIVATE_KEY` ⚠️ (배포자 private key)

**배포 순서**:
1. MonadCCIPReceiver 배포
2. MinecraftPFP 연결 (`setMinecraftPFP()`)
3. Trusted Verifier 설정 (`setTrustedVerifier()`)
4. MinecraftPFP에 CCIPReceiver 연결 (`setCCIPReceiver()`)

**배포 후**:
```bash
# .env.local에 추가
NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS=<배포된_주소>
```

---

### 3. 환경 변수 최종 설정 ⚠️ **필수**

**파일**: `.env.local`

**필수 변수**:
```bash
# ===== Sepolia =====
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.gateway.tenderly.co
SEPOLIA_CCIP_ROUTER=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
SEPOLIA_CHAIN_SELECTOR=16015286601757825753
NEXT_PUBLIC_SEPOLIA_LINK_TOKEN=0x779877A7B0D9E8603169DdbD7836e478b4624789

# ===== NFT Contracts =====
NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT=0x583aeA758A94d74bA997326634B23a2Ea6f4e005

# ===== 배포 후 설정 필요 =====
NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=       # Sepolia 배포 후 입력
NEXT_PUBLIC_MONAD_CCIP_ROUTER=              # Monad CCIP Router 주소
NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS=    # Monad 배포 후 입력
NEXT_PUBLIC_CONTRACT_ADDRESS=               # MinecraftPFP 주소
NEXT_PUBLIC_MONAD_CHAIN_SELECTOR=2183018362218727504

# ===== Supabase =====
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>

# ===== 배포자 =====
PRIVATE_KEY=<your_private_key>
```

---

### 4. E2E 테스트 체크리스트 🧪

#### Happy Path 테스트

**Sepolia 네트워크 (Step 1-3)**:
```bash
# 1. Sepolia 연결
# - RainbowKit으로 Sepolia 네트워크 전환
# - 지갑 주소 확인

# 2. NFT 소유권 확인
# - SepoliaNFTVerification 컴포넌트에서 "Check NFT" 버튼 클릭
# - API: GET /api/ccip/check-sepolia-nft?address=0x...&nftContract=0x583...
# - 응답: hasNFT: true

# 3. Attestation 생성 및 Bridge
# - "Create Attestation" 버튼 클릭
# - NFTOwnershipVerifier.createAttestation() 호출
# - attestationId 받음
# - "Bridge to Monad" 버튼 클릭
# - NFTOwnershipVerifier.bridgeAttestation() 호출 (LINK 토큰 필요)
# - ccipMessageId 받음
```

**데이터베이스 기록 (Step 4)**:
```bash
# 4. CCIP 메시지 기록
# - API: POST /api/ccip/record-message
# - Body: { monadAddress, sepoliaNFTAddress, ccipMessageId, attestationId, ... }
# - DB 확인: SELECT * FROM ccip_attestations WHERE ccip_message_id = '...';
```

**CCIP 메시지 모니터링 (Step 5)**:
```bash
# 5. 메시지 상태 확인
# - CCIPStatusMonitor 컴포넌트 자동 polling
# - API: GET /api/ccip/monitor/[messageId]
# - 진행률 표시: 25% → 50% → 75% → 100%
# - 예상 시간: 15-30분
```

**Monad 네트워크 (Step 6-7)**:
```bash
# 6. Monad에서 Attestation 확인
# - 네트워크를 Monad로 전환
# - API: GET /api/ccip/attestation-status/0x...
# - MonadCCIPReceiver.hasValidAttestation() 확인
# - 응답: hasAttestation: true

# 7. 골든 크라운 포함 민팅
# - "Mint NFT" 버튼 클릭
# - executeMintPipeline({ hasCCIPAttestation: true })
# - AI 스킨에 골든 크라운 렌더링
# - 메타데이터에 Legendary 속성 추가
```

**메타데이터 검증 (Step 8)**:
```bash
# 8. NFT 메타데이터 확인
# - IPFS에서 메타데이터 조회
# - 확인 항목:
#   - "CCIP Verified": "Yes"
#   - "Cross-Chain NFT Holder": "Ethereum Sepolia"
#   - "Special Trait": "Golden Crown"
#   - "Rarity": "Legendary"
#   - description에 크로스체인 설명 포함
```

#### Edge Cases 테스트

```bash
# 1. NFT 미소유자 접근 시도
# - check-sepolia-nft API: hasNFT: false
# - UI: "Create Attestation" 버튼 비활성화

# 2. Attestation 만료 테스트
# - DB에서 expires_at을 과거로 수정
# - hasValidAttestation: false 확인

# 3. 중복 Attestation 사용
# - DB에서 used=true로 설정
# - 민팅 시도 → 거부 확인

# 4. LINK 토큰 부족
# - LINK 잔액 0인 상태에서 bridge 시도
# - 트랜잭션 실패 확인
```

---

### 5. 컨트랙트 검증 (선택사항)

**Sepolia Etherscan**:
```bash
npx hardhat verify --network sepolia \
  <VERIFIER_ADDRESS> \
  "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59"
```

**Monad Explorer**:
```bash
npx hardhat verify --network monad \
  <RECEIVER_ADDRESS> \
  "<MONAD_CCIP_ROUTER>"
```

---

## 📝 배포 순서 요약

### 준비 단계
1. ✅ Supabase 프로젝트 생성
2. ✅ .env.local 기본 설정
3. ✅ Sepolia LINK 토큰 보유 확인

### 배포 단계
1. **Supabase 마이그레이션**
   ```bash
   supabase db push
   ```

2. **MinecraftPFP 배포** (먼저 필요)
   ```bash
   npx hardhat run scripts/deploy.js --network monad
   ```

3. **Sepolia CCIP 배포**
   ```bash
   npx hardhat run scripts/deploy-ccip.js --network sepolia
   # .env.local 업데이트: NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS
   ```

4. **Monad CCIP 배포**
   ```bash
   npx hardhat run scripts/deploy-ccip.js --network monad
   # .env.local 업데이트: NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS
   ```

5. **프론트엔드 빌드 & 실행**
   ```bash
   pnpm build
   pnpm dev
   ```

6. **E2E 테스트**
   - Sepolia에서 NFT 확인
   - Attestation 생성
   - Monad로 Bridge
   - 골든 크라운 민팅

---

## ⚠️ 알려진 이슈 및 주의사항

### 1. CCIP 메시지 전송 시간
- **예상**: 15-30분
- **실제**: 네트워크 상황에 따라 변동
- **해결**: CCIPStatusMonitor로 실시간 모니터링

### 2. LINK 토큰 필요
- **필요량**: 메시지당 ~0.1-0.5 LINK (가스비 포함)
- **획득**: Chainlink Faucet (https://faucets.chain.link/)

### 3. NFT 전송 후 Attestation
- **문제**: NFT를 다른 주소로 전송하면 bridgeAttestation 실패
- **해결**: NFT 소유권 재검증 로직 (컨트랙트에 구현됨)

### 4. Monad CCIP Router
- **상태**: 아직 공식 배포 주소 미공개
- **임시**: 환경 변수로 설정 가능하도록 구현
- **업데이트**: Monad 공식 문서 확인 필요

### 5. Public RPC Rate Limit
- **문제**: Sepolia Public RPC는 rate limit 있음
- **해결**: Infura/Alchemy 유료 플랜 사용 권장

---

## 📚 참고 문서

1. **컨트랙트**:
   - `contracts/sepolia/NFTOwnershipVerifier.sol`
   - `contracts/monad/MonadCCIPReceiver.sol`
   - `contracts/MinecraftPFPWithWealth.sol`

2. **UI 컴포넌트**:
   - `components/SepoliaNFTVerification.tsx`
   - `components/CCIPStatusMonitor.tsx`

3. **API 엔드포인트**:
   - `src/app/api/ccip/check-sepolia-nft/route.ts`
   - `src/app/api/ccip/record-message/route.ts`
   - `src/app/api/ccip/monitor/[messageId]/route.ts`
   - `src/app/api/ccip/attestation-status/[address]/route.ts`

4. **기타**:
   - `claudedocs/CCIP_CROSSCHAIN_IMPLEMENTATION_PLAN.md` - 전체 구현 계획
   - `src/lib/db/migrations/002_ccip_attestations.sql` - DB 스키마

---

## 🎯 다음 세션에서 할 일

### 우선순위 1: 필수 배포
1. Supabase 마이그레이션 실행
2. Sepolia에 CCIP 컨트랙트 배포
3. Monad에 CCIP 컨트랙트 배포
4. .env.local 최종 설정

### 우선순위 2: 테스트
1. Sepolia NFT 소유권 확인
2. Attestation 생성 및 Bridge
3. Monad에서 골든 크라운 민팅
4. 메타데이터 검증

### 우선순위 3: 문서화
1. 실제 배포 주소 기록
2. 테스트 결과 스크린샷
3. 사용자 가이드 작성

---

**작성 완료일**: 2025-01-15
**다음 업데이트**: 배포 완료 후

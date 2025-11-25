# CCIP 크로스체인 구현 - 남은 작업

**날짜**: 2025-01-15
**상태**: Phase 1-3, 5 완료 / Phase 4, 6-8 남음

---

## ✅ 완료된 작업

### Phase 1: 스마트 컨트랙트 개발
- ✅ `contracts/sepolia/NFTOwnershipVerifier.sol` - Sepolia NFT 소유권 검증 및 CCIP 전송
- ✅ `contracts/monad/MonadCCIPReceiver.sol` - Monad CCIP 메시지 수신 및 attestation 관리
- ✅ `contracts/MinecraftPFPWithWealth.sol` - CCIP 기능 추가 (setCCIPReceiver, hasCCIPBonus)
- ✅ `scripts/deploy-ccip.ts` - 양방향 배포 스크립트
- ✅ 컴파일 성공 확인

### Phase 2: 데이터베이스
- ✅ `src/lib/db/migrations/002_ccip_attestations.sql` - CCIP attestation 테이블 생성

### Phase 3: Sepolia 연동 UI
- ✅ `src/lib/chains.ts` - Sepolia 체인 정의 및 CCIP 설정
- ✅ `src/lib/wagmi.ts` - Sepolia 체인 지원 추가
- ✅ `components/SepoliaNFTVerification.tsx` - NFT 검증 UI
- ✅ `components/CCIPStatusMonitor.tsx` - CCIP 상태 모니터링 UI

### Phase 5: API 엔드포인트 (Placeholder)
- ✅ `src/app/api/ccip/check-sepolia-nft/route.ts`
- ✅ `src/app/api/ccip/record-message/route.ts`
- ✅ `src/app/api/ccip/monitor/[messageId]/route.ts`

---

## 🔧 남은 작업

### Phase 4: 시각적 요소 렌더링 (골든 크라운)

#### 4.1 AI 스킨 생성에 CCIP 플래그 추가
**파일**: `src/lib/aiSkinGenerator.ts`

```typescript
// 함수 시그니처 수정
export async function generateAISkin(
  traits: SkinTraits,
  apiKey: string,
  hasCCIPAttestation: boolean = false // ⭐ 새 파라미터 추가
): Promise<string>

// CCIP 요소 렌더링 추가
if (hasCCIPAttestation) {
    console.log('🌟 Rendering CCIP special visual: Golden Crown');
    renderGoldenCrown(ctx);
}

// 골든 크라운 렌더링 함수 추가
function renderGoldenCrown(ctx: CanvasRenderingContext2D) {
    const GOLD = '#FFD700';
    const DARK_GOLD = '#DAA520';
    const LIGHT_GOLD = '#FFEC8B';

    // Minecraft UV 좌표: Head Overlay (40, 8) ~ (48, 16)
    const crownPixels = [
        // 하단 (y=15)
        { x: 41, y: 15, color: DARK_GOLD },
        { x: 42, y: 15, color: GOLD },
        { x: 43, y: 15, color: GOLD },
        { x: 44, y: 15, color: GOLD },
        { x: 45, y: 15, color: GOLD },
        { x: 46, y: 15, color: DARK_GOLD },

        // 중간 (y=14)
        { x: 41, y: 14, color: GOLD },
        { x: 42, y: 14, color: LIGHT_GOLD },
        { x: 43, y: 14, color: GOLD },
        { x: 44, y: 14, color: GOLD },
        { x: 45, y: 14, color: LIGHT_GOLD },
        { x: 46, y: 14, color: GOLD },

        // 윗부분 (y=13)
        { x: 42, y: 13, color: GOLD },
        { x: 43, y: 13, color: LIGHT_GOLD },
        { x: 44, y: 13, color: LIGHT_GOLD },
        { x: 45, y: 13, color: GOLD },

        // 뾰족한 부분 (y=12)
        { x: 42, y: 12, color: LIGHT_GOLD },
        { x: 45, y: 12, color: LIGHT_GOLD },

        // 정상 (y=11)
        { x: 42, y: 11, color: GOLD },
        { x: 45, y: 11, color: GOLD },
    ];

    crownPixels.forEach(({ x, y, color }) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    });

    console.log('✨ Golden Crown rendered at Head Overlay');
}
```

#### 4.2 민팅 파이프라인 업데이트
**파일**: `src/lib/mintPipeline.ts`

```typescript
// 인터페이스 수정
export interface MintPipelineOptions {
  address: `0x${string}`;
  apiKey: string;
  generationMethod: 'ai' | 'procedural';
  onProgress?: (stage: string, progress: number) => void;
  hasCCIPAttestation?: boolean; // ⭐ 새 필드 추가
}

// executeMintPipeline 함수에서 CCIP 플래그 전달
export async function executeMintPipeline(options: MintPipelineOptions) {
    const { hasCCIPAttestation = false } = options;

    // AI 스킨 생성 시 플래그 전달
    if (generationMethod === 'ai') {
        textureDataUrl = await generateAISkin(traits, apiKey, hasCCIPAttestation);
    }

    // 메타데이터 생성 시 CCIP 속성 추가
    const metadata = generateMetadata({
        tokenId: 0,
        gifCID,
        traits,
        hasCCIPAttestation
    });
}

// 메타데이터 생성 함수 수정
function generateMetadata(options: {
    tokenId: number;
    gifCID: string;
    traits: SkinTraits;
    hasCCIPAttestation?: boolean;
}) {
    const { hasCCIPAttestation } = options;

    const attributes = [
        // 기존 속성들...
    ];

    // CCIP 속성 추가
    if (hasCCIPAttestation) {
        attributes.push(
            {
                trait_type: "CCIP Verified",
                value: "Yes"
            },
            {
                trait_type: "Cross-Chain NFT Holder",
                value: "Ethereum Sepolia"
            },
            {
                trait_type: "Special Trait",
                value: "Golden Crown"
            },
            {
                trait_type: "Rarity",
                value: "Legendary"
            }
        );
    }

    return {
        name: `Minecraft PFP #${tokenId}`,
        description: hasCCIPAttestation
            ? "A unique Minecraft-style PFP NFT with special cross-chain verified traits, featuring a golden crown earned by proving NFT ownership on Ethereum Sepolia."
            : "A unique Minecraft-style PFP NFT generated based on your wallet address and on-chain wealth.",
        image: `ipfs://${gifCID}`,
        animation_url: `ipfs://${gifCID}`,
        attributes,
    };
}
```

---

### Phase 6: 메인 페이지 통합

**파일**: `src/app/page.tsx` (또는 메인 민팅 페이지)

#### 6.1 필요한 import 추가
```typescript
import { SepoliaNFTVerification } from '@/components/SepoliaNFTVerification';
import { CCIPStatusMonitor } from '@/components/CCIPStatusMonitor';
```

#### 6.2 상태 관리 추가
```typescript
const [hasAttestation, setHasAttestation] = useState(false);
const [ccipMessageId, setCCIPMessageId] = useState<string | null>(null);

// Attestation 상태 확인
useEffect(() => {
    if (address) {
        checkAttestationStatus();
    }
}, [address]);

async function checkAttestationStatus() {
    try {
        const response = await fetch(`/api/ccip/attestation-status/${address}`);
        const data = await response.json();
        setHasAttestation(data.hasAttestation);
    } catch (error) {
        console.error('Failed to check attestation:', error);
    }
}
```

#### 6.3 UI 구조 추가
```typescript
return (
    <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Minecraft PFP NFT</h1>

        {/* CCIP Attestation Section */}
        <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
                🌉 Cross-Chain NFT Verification
            </h2>
            <p className="mb-4">
                Own an NFT on Ethereum Sepolia? Get a special <strong>Golden Crown</strong> trait on Monad!
            </p>

            {isConnected ? (
                <>
                    <SepoliaNFTVerification onMessageSent={setCCIPMessageId} />

                    {/* CCIP 전송 상태 모니터링 */}
                    {ccipMessageId && address && (
                        <CCIPStatusMonitor
                            messageId={ccipMessageId}
                            monadAddress={address}
                        />
                    )}
                </>
            ) : (
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
                    Please connect your wallet to verify NFT ownership
                </div>
            )}
        </section>

        {/* Mint Section */}
        <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Mint Your PFP</h2>

            {/* Attestation 상태 표시 */}
            {hasAttestation && (
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                    <p className="font-bold">✨ CCIP Attestation Verified!</p>
                    <p>
                        Your NFT will have a special <strong>Golden Crown</strong> trait
                        and Legendary rarity status.
                    </p>
                </div>
            )}

            {/* 민팅 버튼 - hasCCIPAttestation 전달 */}
            <button
                onClick={() => handleMint(hasAttestation)}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg"
            >
                Mint NFT
            </button>
        </section>
    </main>
);
```

#### 6.4 민팅 함수 수정
```typescript
async function handleMint(hasCCIPAttestation: boolean) {
    if (!address) return;

    setMinting(true);
    try {
        // 민팅 파이프라인 실행 (CCIP 플래그 포함)
        const result = await executeMintPipeline({
            address,
            apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY!,
            generationMethod: 'ai',
            hasCCIPAttestation, // ⭐ CCIP 플래그 전달
            onProgress: (stage, progress) => {
                console.log(`${stage}: ${progress}%`);
            }
        });

        // 컨트랙트 민팅 호출
        // ... (기존 민팅 로직)

        console.log('Mint complete!', result);
    } catch (error) {
        console.error('Mint failed:', error);
    } finally {
        setMinting(false);
    }
}
```

---

### Phase 7: 환경 변수 설정

**.env.local 파일에 추가**:

```bash
# ==========================================
# Sepolia Testnet
# ==========================================
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111

# ==========================================
# CCIP Configuration
# ==========================================
# Sepolia
SEPOLIA_CCIP_ROUTER=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
SEPOLIA_CHAIN_SELECTOR=16015286601757825753
NEXT_PUBLIC_SEPOLIA_LINK_TOKEN=0x779877A7B0D9E8603169DdbD7836e478b4624789

# Monad
NEXT_PUBLIC_MONAD_CCIP_ROUTER=0x5f16...3E54  # 실제 주소로 교체
NEXT_PUBLIC_MONAD_CHAIN_SELECTOR=2183018362218727504

# ==========================================
# NFT Contracts (배포 후 업데이트)
# ==========================================
NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT=0x...  # Sepolia에서 검증할 NFT 컬렉션
NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=0x...  # NFTOwnershipVerifier 주소
NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS=0x...  # MonadCCIPReceiver 주소
```

---

### Phase 8: 배포 및 테스트

#### 8.1 컨트랙트 배포

**Sepolia 배포**:
```bash
# 1. Sepolia에 NFTOwnershipVerifier 배포
npx hardhat run scripts/deploy-ccip.ts --network sepolia

# 2. .env 업데이트
NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=<배포된 주소>
```

**Monad 배포**:
```bash
# 1. Monad에 MonadCCIPReceiver 배포
npx hardhat run scripts/deploy-ccip.ts --network monadTestnet

# 2. .env 업데이트
NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS=<배포된 주소>
```

#### 8.2 데이터베이스 마이그레이션
```bash
# PostgreSQL에 마이그레이션 실행
psql -d your_database -f src/lib/db/migrations/002_ccip_attestations.sql
```

#### 8.3 API 엔드포인트 구현 완료

**TODO 리스트**:
1. `src/app/api/ccip/check-sepolia-nft/route.ts` - 실제 Sepolia RPC 호출 구현
2. `src/app/api/ccip/record-message/route.ts` - 실제 DB 삽입 구현
3. `src/app/api/ccip/monitor/[messageId]/route.ts` - 실제 DB 조회 구현
4. `src/app/api/ccip/attestation-status/[address]/route.ts` - 신규 생성 필요

**attestation-status API 예시**:
```typescript
// src/app/api/ccip/attestation-status/[address]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { monadTestnet } from '@/lib/chains';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address as `0x${string}`;

  try {
    const client = createPublicClient({
      chain: monadTestnet,
      transport: http()
    });

    const MONAD_CCIP_RECEIVER = process.env.NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS as `0x${string}`;

    const hasAttestation = await client.readContract({
      address: MONAD_CCIP_RECEIVER,
      abi: [
        {
          name: 'hasValidAttestation',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'user', type: 'address' }],
          outputs: [{ name: 'valid', type: 'bool' }]
        }
      ],
      functionName: 'hasValidAttestation',
      args: [address]
    });

    return NextResponse.json({
      hasAttestation,
      address
    });
  } catch (error) {
    console.error('Attestation check error:', error);
    return NextResponse.json({ error: 'Failed to check attestation' }, { status: 500 });
  }
}
```

#### 8.4 E2E 테스트 체크리스트

**Happy Path**:
- [ ] Sepolia 네트워크 연결
- [ ] NFT 소유권 확인
- [ ] Attestation 생성
- [ ] CCIP 메시지 전송
- [ ] Monad에서 수신 확인
- [ ] Monad에서 민팅 (특수 trait 포함)
- [ ] 메타데이터 확인 (골든 크라운 포함)

**Edge Cases**:
- [ ] NFT 미소유자 접근 시도 → 차단
- [ ] Attestation 생성 후 NFT 전송 → Bridge 실패
- [ ] 만료된 Attestation 사용 시도 → 거부
- [ ] 중복 Attestation 사용 → 거부

---

## 📝 실행 순서

### 1단계: 시각적 요소 추가 (선택사항)
```bash
# aiSkinGenerator.ts 수정
# mintPipeline.ts 수정
```

### 2단계: API 구현 완료
```bash
# check-sepolia-nft API 실제 구현
# record-message API DB 연결
# attestation-status API 생성
```

### 3단계: 메인 페이지 통합
```bash
# src/app/page.tsx 수정
```

### 4단계: 환경 변수 설정
```bash
# .env.local 업데이트
```

### 5단계: 컨트랙트 배포
```bash
npx hardhat run scripts/deploy-ccip.ts --network sepolia
npx hardhat run scripts/deploy-ccip.ts --network monadTestnet
```

### 6단계: 데이터베이스 마이그레이션
```bash
psql -d your_database -f src/lib/db/migrations/002_ccip_attestations.sql
```

### 7단계: 테스트
```bash
# 프론트엔드 실행
pnpm dev

# E2E 테스트 진행
```

---

## 🎯 핵심 포인트

### CCIP 보안
- ✅ 화이트리스트 기반 신뢰 모델
- ✅ Attestation 만료 관리 (7일)
- ✅ 중복 사용 방지 (used 플래그)
- ✅ NFT 소유권 재검증 (bridge 시)

### 사용자 경험
- ✅ 명확한 네트워크 전환 가이드
- ✅ CCIP 전송 상태 실시간 모니터링
- ✅ 예상 대기 시간 표시 (15-30분)
- ✅ 특수 trait 시각적 강조

---

## 📚 참고 파일

- `claudedocs/CCIP_CROSSCHAIN_IMPLEMENTATION_PLAN.md` - 전체 계획서
- `contracts/sepolia/NFTOwnershipVerifier.sol` - Sepolia 컨트랙트
- `contracts/monad/MonadCCIPReceiver.sol` - Monad 컨트랙트
- `components/SepoliaNFTVerification.tsx` - Sepolia UI
- `components/CCIPStatusMonitor.tsx` - 모니터링 UI

---

**작성 완료일**: 2025-01-15
**다음 세션에서 실행**: Phase 4, 6-8

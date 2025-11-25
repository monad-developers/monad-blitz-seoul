# 시스템 아키텍처

## 🏗️ 아키텍처 구성

### 1. 데이터 저장 전략

#### 온체인 저장
- ✅ IPFS URI (CID)
- ✅ 민팅 시점의 자산 스냅샷
- ✅ Wealth tier 정보
- ❌ 64x64 픽셀 데이터 (16KB, 가스비 과다)

#### 오프체인 저장 (IPFS)
- 64x64 PNG 이미지 파일
- 애니메이션 GIF 파일
- 메타데이터 JSON

**이유**:
- 64x64 RGBA 이미지 = 16,384 bytes
- 온체인 저장 시 수백만 gas 소요
- IPFS CID 저장은 ~46 bytes로 경제적

---

## 🔄 시스템 플로우

### 민팅 프로세스

```
1. 사용자 지갑 연결
   ↓
2. 주소 기반 Traits 생성 (Deterministic)
   ↓
3. 자산 가치 조회 (ETH + USDT + USDC)
   ↓
4. Wealth Tier 결정 및 Special Item 부여
   ↓
5. Three.js로 3D 모델 렌더링
   ↓
6. 애니메이션 GIF 생성 (60 프레임)
   ↓
7. IPFS에 업로드 (GIF + 메타데이터)
   ↓
8. 스마트 컨트랙트 민팅 트랜잭션
   ↓
9. 온체인 스냅샷 저장
```

### 데이터 조회 프로세스

```
1. 토큰 ID로 조회
   ↓
2. 온체인에서 메타데이터 CID 가져오기
   ↓
3. IPFS에서 메타데이터 JSON 조회
   ↓
4. 메타데이터에서 GIF CID 가져오기
   ↓
5. IPFS에서 GIF 이미지 조회
   ↓
6. NFT 표시
```

---

## 📊 데이터 구조

### 온체인 데이터

```solidity
struct MintSnapshot {
    uint256 totalWealthUSD;  // 총 자산 (8 decimals)
    uint8 wealthTier;         // 등급 (0-5)
    uint256 ethBalance;       // ETH 잔액
    uint256 usdtBalance;      // USDT 잔액
    uint256 usdcBalance;      // USDC 잔액
    uint256 timestamp;        // 민팅 시각
}

mapping(uint256 => MintSnapshot) public mintSnapshots;
mapping(address => uint256) public ownerToToken;
```

### 오프체인 데이터 (IPFS)

**메타데이터 JSON**:
```json
{
  "name": "Minecraft PFP #1234",
  "description": "...",
  "image": "ipfs://[GIF_CID]",
  "attributes": [...]
}
```

**GIF 파일**:
- 크기: 512x512 픽셀
- 프레임: 60 프레임
- FPS: ~30
- 형식: GIF (무한 반복)

---

## 🔐 보안 고려사항

### 1. Price Feed 신뢰성
- Chainlink Price Feed 사용
- 데이터 업데이트 시간 검증 (1시간 이내)
- Price < 0 체크

### 2. 재진입 공격 방지
- `_safeMint` 사용
- CEI (Checks-Effects-Interactions) 패턴 준수

### 3. 민팅 제한
- 주소당 1개만 민팅 가능
- `ownerToToken` 매핑으로 검증

### 4. IPFS 데이터 무결성
- CID는 콘텐츠 해시이므로 변조 불가능
- 메타데이터 변경 시 새로운 CID 생성 필요

---

## ⚡ 가스 최적화

### 1. Storage 최적화
- `uint8` 사용 (0-255 범위)
- Struct packing (256 bits 단위)
- `immutable` 변수 사용 (constructor에서 설정)

### 2. 계산 최적화
- Trait 생성은 순수 함수 (Pure function)
- View 함수로 오프체인에서 미리 계산 가능
- 불필요한 Storage 쓰기 최소화

### 3. 배치 최적화
- 여러 값을 한 번에 반환하는 함수
- 단일 트랜잭션에서 모든 데이터 기록

---

## 🌐 네트워크 지원

### Ethereum Mainnet
- 메인넷 배포 준비
- 높은 가스비 고려

### Sepolia Testnet
- 개발 및 테스트용
- Chainlink Price Feed 지원

### 향후 확장 가능
- Polygon
- Arbitrum
- Optimism
- Base

---

## 📈 확장성 고려사항

### 1. 프론트엔드 확장성
- Three.js 렌더링 캐싱
- IPFS Gateway CDN 활용
- 이미지 lazy loading

### 2. 스마트 컨트랙트 확장성
- Proxy 패턴 고려 (업그레이드 가능)
- 기능별 라이브러리 분리
- 가스비 최적화

### 3. IPFS 확장성
- Pinata Pinning 서비스 활용
- 여러 Gateway 활용 (fallback)
- 로컬 캐싱 전략

---

## 🔄 업데이트 전략

### NFT 이미지 업데이트
- 사용자가 `updateTokenURI` 함수 호출
- 새로운 IPFS CID로 업데이트 가능
- 원본 민팅 스냅샷은 불변

### 컨트랙트 업그레이드
- 현재 버전: 업그레이드 불가능
- 향후 고려: UUPS 또는 Transparent Proxy 패턴

### 메타데이터 표준
- OpenSea Metadata Standard 준수
- 호환성 보장

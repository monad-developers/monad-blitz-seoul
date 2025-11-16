# Monad Grant Console

Chainlink CCIP 기반의 그랜트 집행 툴입니다. USD 예산을 입력하면 Chainlink 데이터 피드에서 실시간 환산가를 가져와 ETH/USDC/LINK 비중을 계산하고, CCIP 멀티체인 전송 계획을 UI에서 설계할 수 있습니다.

## 주요 기능

- **실시간 피드 연동**: `/api/prices` 라우트가 viem을 통해 테스트넷 온체인 데이터 피드를 직접 호출합니다.
- **예산 슬라이싱**: 총 USD 값을 URL 쿼리(`?amount=`)와 동기화하고 슬라이더로 자산 비율을 자유롭게 조정합니다.
- **CCIP 수령인 관리**: 체인 셀렉터, 지갑 주소, 자산, USD 지분을 입력하면 즉시 토큰 수량과 체인별 요약을 계산합니다.
- **시뮬레이션 로그**: 전송 준비 시 체인·주소별 로그를 쌓아 실제 CCIP 실행 전에 검증할 수 있습니다.
- **지갑 연결**: wagmi 기반 연결 버튼으로 테스트넷 지갑을 연결해 향후 CCIP 트랜잭션 실행 준비를 합니다.
- **원클릭 데이터 전송**: “Dispatch via CCIP” 버튼으로 `/api/ccip/send` 라우트를 호출해 메시지 ID/ETA를 즉시 확인합니다.

## 기술 스택

- Next.js 16 App Router, React 19
- TypeScript 5, Zod, 커스텀 쿼리 상태 훅
- Tailwind CSS 4 + 커스텀 다크 UI
- Chainlink Marketplace API

## 설치 및 실행

```bash
cd monad_frontend
npm install       # 네트워크가 막힌 환경에서는 의존성을 직접 내려받아야 합니다.
npm run dev       # http://localhost:3000
```

> 현재 저장소에서는 외부 네트워크 차단으로 `npm install`이 실패했습니다. 인터넷이 가능한 환경에서 다시 설치해 주세요.

## 디렉터리 개요

```
src/
├─ app/
│  ├─ api/prices/route.ts   # Chainlink 가격 프락시
│  ├─ error.tsx, loading.tsx
│  ├─ layout.tsx, page.tsx
├─ components/grant-tool/
│  ├─ grant-console.tsx     # 인트로 + Suspense
│  └─ grant-form.tsx        # 메인 UI + 상태 관리
├─ config/
│  ├─ assets.ts             # 지원 자산 메타데이터
│  ├─ chains.ts             # CCIP 체인/라우터 + receiver/RPC env
│  └─ feeds.ts              # 온체인 데이터 피드 주소
├─ hooks/use-price-feeds.ts # 60초 주기 폴링 훅
└─ lib/format.ts            # 숫자 포맷 유틸
```

## API: GET `/api/prices`

| 파라미터 | 설명 | 기본값 |
| --- | --- | --- |
| `symbols` | `ETH,USDC,LINK` 형태의 심볼 CSV | 모든 지원 자산 |

### 응답 예시

```json
{
  "timestamp": "2024-05-12T09:00:00.000Z",
  "prices": [
    {"symbol": "ETH", "price": 3250.12, "updatedAt": "…", "source": "chainlink-marketplace", "isFallback": false},
    {"symbol": "USDC", "price": 0.999, "updatedAt": "…", "source": "chainlink-marketplace", "isFallback": false}
  ]
}
```

## API: POST `/api/ccip/send`

시뮬레이션 전송 버튼이 호출하는 가짜 CCIP 디스패치 엔드포인트입니다. 실제 라우터 대신 메시지 ID와 ETA를 생성해 UI에 표시합니다.

| 필드 | 설명 |
| --- | --- |
| `sourceChain` | (선택) 발신 체인 레이블. 기본값 `"Monad"` |
| `totalUsd` | 수령인에게 배분할 총 USD |
| `recipients[]` | `receiver`(체인별 CCIP 컨트랙트), `beneficiary`(최종 수령 지갑), 체인/자산, USD/토큰 수량 |
| `chainSummary` | UI가 계산한 체인별 요약 (검증용) |

### 응답 예시

```json
{
  "messageId": "0x74b8...",
  "lane": "Monad ⇒ Base, Polygon",
  "eta": "2024-05-12T09:05:00.000Z",
  "totalUsd": 25000,
  "recipients": [...],
  "simulatedTxHash": "0x91d2..."
}
```

- 체인별 CCIP receiver 주소는 `src/config/chains.ts`의 `receiver` 필드에서 관리하며, UI에서 입력하는 "Address"는 최종 토큰을 받을 beneficiary 주소입니다.
- 버튼을 누르면 상태가 `Dispatch via CCIP` 섹션에 반영되며, 성공 시 메시지 ID, 라우팅 구간, ETA, 그리고 각 체인의 Router `typeAndVersion` 결과가 표시됩니다.

## 환경 변수

온체인 호출을 위해 아래 RPC 엔드포인트/키를 `.env.local` 등에 설정해야 합니다.

```
# 선택사항 – 지정하면 기본 URL 대신 사용됨
MONAD_RPC_URL=
SEPOLIA_RPC_URL=
ARBITRUM_SEPOLIA_RPC_URL=
AVALANCHE_FUJI_RPC_URL=
BASE_SEPOLIA_RPC_URL=
OP_SEPOLIA_RPC_URL=
```

각 체인은 `src/config/chains.ts`에 기본 RPC URL이 이미 채워져 있으므로 위 변수는 필요 시 override 용도로만 사용하면 됩니다. 데이터 피드 주소(`src/config/feeds.ts`)는 현재 목값이므로 실제 Aggregator 컨트랙트 주소·RPC로 교체해야 합니다.

## 작업 이력 요약

- Next.js 프로젝트를 TypeScript 기반으로 전환하고 레이아웃/페이지 구조를 재구성했습니다.
- Chainlink 자산·체인 설정, 포맷 유틸, 가격 API 라우트, 가격 폴링 훅을 추가했습니다.
- 그랜트 UI 전반(예산 입력, 슬라이더, 수령인 테이블, 체인별 요약, 시뮬 로그, 에러/로딩 바운더리)을 구현했습니다.

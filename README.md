# Monad USD→USDC CCIP Airdrop (Hackathon MVP)

이 프로젝트는 Monad 테스트넷에서 **USD 예산만 입력**하면 사용자가 가진 WETH를 오라클 가격으로 환산해 받고, Router treasury에 쌓아둔 USDC로 CCIP Programmable Token Transfer를 실행해 목적 체인으로 에어드랍하는 데모용 MVP입니다.

## TL;DR
- Funding 자산: **WETH 한 개** (ERC-20 wrapped native)
- 에어드랍 토큰: **USDC 한 개** (또는 CCIP 테스트 USDC)
- 체인: **Source = Monad Testnet**, **Destination = 1개 EVM 테스트넷(Sepolia 예시)**
- 가격: Monad의 **Chainlink Data Feeds**(WETH/USD, USDC/USD) 사용
- “Swap”: 실제 DEX 없이 **Router가 오라클 레이트로 WETH를 받고 treasury USDC를 소진**하는 고정 레이트 방식

## End-to-End 데모 흐름 (해커톤용)
1) UI에서 `Total Budget (USD)`에 `1000` 입력  
2) Funding Asset 드롭다운에서 `WETH` 선택 → `quoteRequiredWeth(1000)` 뷰 호출로 “필요 WETH ≈ 0.42” 표시  
3) 버튼 순서: `Approve 0.42 WETH` → `Fund & Airdrop`  
   - Router가 WETH 수령 → “1000 USD worth”로 검증  
   - Router treasury의 USDC를 잡아서 CCIP `ccipSend()` 호출 (토큰 + recipients 데이터)  
4) 목적 체인 Receiver가 CCIP 수신 → recipients decode → 각 주소로 USDC 전송  
5) 프론트에서 Monad tx hash + Dest tx hash 링크 노출 (예: 블록 익스플로러)

## 온체인 컴포넌트 (MVP 스펙)
- **PriceOracleAdapter (Monad)**  
  - `mapping(address => address) priceFeeds` (token → AggregatorV3)  
  - `getUsdPrice(token) returns (price, decimals)`; `answer <= 0` 혹은 `updatedAt` stale(예: 1시간) 시 revert  
  - Chainlink `latestRoundData()` 기반
- **Funding + Swap Router (Monad)**  
  - 상태: `weth`, `usdc`, `oracle`, `ccipRouter`, `destChainSelector`, `destReceiver`  
  - `quoteRequiredWeth(usdAmount)`: 오라클 레이트로 필요 WETH 계산  
  - `fundAndAirdropEqualSplit(usdAmount, recipients[])`:  
    1) 필요 WETH 산출 후 `transferFrom`  
    2) USDC 요구량 계산 (USDC/USD 피드)  
    3) 균등 분배 금액 계산  
    4) CCIP `ccipSend()` 호출: `tokenAmounts=[totalUsdc]`, `data=abi.encode(recipients, amountPerRecipient)`  
    5) CCIP fee는 LINK/native 중 Monad CCIP 디렉터리 설정에 맞춤  
  - 전제: Router treasury에 충분한 USDC pre-fund
- **CCIP Receiver (Destination)**  
  - CCIP Receiver 인터페이스 구현  
  - `_ccipReceive`: source chain/Router 검증 → 토큰 주소 검증 → `data` decode 후 for-loop로 USDC 전송

## 프론트 MVP 요구사항
- 입력: `Total Budget (USD)`, Funding Asset(WETH), `recipients[]`  
- Preview: `quoteRequiredWeth` 호출 결과 + recipients 수에 따른 1인당 USDC 표시  
- 액션: `Approve(requiredWeth)` → `fundAndAirdropEqualSplit(usd, recipients)`  
- 상태표시: pending/confirmed, CCIP 도착 후 dest tx hash 링크

## 데모 스크립트 (3~5분)
1. **문제 제시**: 멀티체인 에어드랍 시 USD 기준 예산 관리 + 체인별 UX 난이도  
2. **솔루션 한 줄**: “Monad에서 USD 예산만 입력 → WETH로 펀딩 → Router treasury USDC로 CCIP 에어드랍”  
3. **라이브 데모**  
   - UI에 `1000` USD 입력, recipients 3명 추가  
   - Preview로 “필요 WETH ≈ 0.42” 확인  
   - `Approve` → `Fund & Airdrop` 실행 (Monad tx hash 표시)  
   - CCIP 도착 후 dest tx hash 링크 클릭, 수신자 잔액 확인  
4. **기술 포인트**  
   - Chainlink Data Feeds on Monad: 가격 안정성 + stale 체크  
   - CCIP Programmable Token Transfer: 토큰 + 데이터 동시 전송  
   - 한 트랜잭션으로 funding + swap(oracle-rate) + cross-chain airdrop 수행  
5. **향후 확장** (짧게)  
   - multi-asset funding, multi-destination, 실제 DEX 연동, Data Streams 활용 등

## 역할 분담 가이드 (예시)
- **스마트 컨트랙트**: Adapter/Router/Receiver 구현, CCIP 파라미터 세팅, treasury USDC 채우기  
- **프론트엔드**: quote 뷰 + approve/execute 플로우, 트랜잭션 상태/링크, recipients UX  
- **데브옵스/데모**: 테스트넷 자금/토큰 준비, CCIP fee 설정, 스크린 레코딩 또는 라이브 리허설

## 사전 준비 체크리스트
- Monad Testnet: WETH 토큰 주소, Chainlink 피드 주소(WETH/USD, USDC/USD), CCIP Router 주소 / LINK or native fee 세팅  
- Destination Testnet: USDC 토큰 주소, Receiver 배포, 체인 셀렉터 확인  
- Treasury: Router가 쓸 USDC 충분히 입금  
- 월렛: MetaMask 네트워크 추가, 두 체인 가스비 확보

## 저장소 구성 메모
- `monad_frontend/` : Next.js 16 + React 19 기반 UI (기존 콘솔). 이번 MVP용으로 quote/approve/execute UI를 추가 예정.  
- 온체인 솔리디티 코드는 별도 패키지로 추가 예정 (예: `contracts/`).


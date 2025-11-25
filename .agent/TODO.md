# Minecraft PFP NFT - 작업 진행 상황

## 🎯 전체 진행 상황: 0% (0/8)

---

## ✅ 완료된 작업 (0/8)

_아직 없음_

---

## 🔄 진행 중인 작업 (0/8)

_아직 없음_

---

## 📋 대기 중인 작업 (8/8)

### Phase 1: 프로젝트 초기 설정
- [ ] 1.1 Next.js + TypeScript 프로젝트 초기화
- [ ] 1.2 Hardhat 스마트 컨트랙트 환경 설정
- [ ] 1.3 필수 의존성 설치 (Three.js, Wagmi, Viem, Ethers, Pinata 등)
- [ ] 1.4 환경 변수 설정 (.env 템플릿)
- [ ] 1.5 기본 프로젝트 구조 생성

### Phase 2: 스마트 컨트랙트 구현 (40%)
- [ ] 2.1 TraitGenerator 라이브러리 구현
  - [ ] generateTraits 함수
  - [ ] getColorFamily 함수
  - [ ] Deterministic 속성 생성 로직
- [ ] 2.2 MinecraftPFPWithWealth 메인 컨트랙트 구현
  - [ ] ERC721URIStorage 상속 및 기본 구조
  - [ ] Chainlink Price Feed 통합
  - [ ] Wealth 계산 로직
  - [ ] Mint 함수 및 스냅샷 저장
  - [ ] Preview 및 조회 함수
- [ ] 2.3 스마트 컨트랙트 테스트 작성
  - [ ] Trait 생성 테스트 (Deterministic 검증)
  - [ ] Wealth 계산 테스트
  - [ ] Minting 로직 테스트
  - [ ] Special Item 할당 테스트
- [ ] 2.4 배포 스크립트 작성
- [ ] 2.5 Hardhat 설정 완료

### Phase 3: Trait 생성 TypeScript 구현 (10%)
- [ ] 3.1 TraitGenerator TypeScript 버전 구현
- [ ] 3.2 Solidity 로직과 정확히 일치하는지 검증
- [ ] 3.3 색상 팔레트 및 스타일 매핑 구현
- [ ] 3.4 Deterministic 테스트 (여러 주소로 검증)

### Phase 4: Three.js 3D 렌더링 시스템 (20%)
- [ ] 4.1 Minecraft 스킨 UV 매핑 구조 구현
- [ ] 4.2 64x64 텍스처 생성 로직
- [ ] 4.3 3D 모델 생성 및 카메라 설정
- [ ] 4.4 애니메이션 로직 (회전)
- [ ] 4.5 프레임 캡처 시스템

### Phase 5: GIF 생성 및 IPFS 업로드 (10%)
- [ ] 5.1 gif.js 통합
- [ ] 5.2 60 프레임 캡처 및 인코딩
- [ ] 5.3 Pinata SDK 통합
- [ ] 5.4 IPFS 업로드 함수 구현
- [ ] 5.5 메타데이터 JSON 생성 및 업로드

### Phase 6: 프론트엔드 구현 (15%)
- [ ] 6.1 지갑 연결 UI (Wagmi + RainbowKit)
- [ ] 6.2 Trait 미리보기 컴포넌트
- [ ] 6.3 Wealth 계산 및 표시
- [ ] 6.4 3D 렌더러 통합
- [ ] 6.5 Mint 트랜잭션 플로우
- [ ] 6.6 로딩 상태 및 에러 처리

### Phase 7: 통합 테스트 및 검증 (3%)
- [ ] 7.1 전체 Mint 플로우 E2E 테스트
- [ ] 7.2 Deterministic 속성 검증
- [ ] 7.3 OpenSea 메타데이터 검증
- [ ] 7.4 가스비 최적화 확인

### Phase 8: 배포 및 문서화 (2%)
- [ ] 8.1 Sepolia 테스트넷 배포
- [ ] 8.2 Etherscan 검증
- [ ] 8.3 배포 가이드 작성
- [ ] 8.4 사용자 매뉴얼 작성

---

## 🚨 현재 작업

**시작 예정**: Phase 1 - 프로젝트 초기 설정

---

## 📝 참고사항

### 중요 원칙
1. **Deterministic 정확성**: 동일 주소 → 동일 속성 (최우선)
2. **Solidity ↔ TypeScript 일치**: Trait 생성 로직 완전 동기화
3. **OpenSea 호환성**: 메타데이터 표준 준수
4. **테스트 커버리지**: >80% 목표

### 기술 스택
- Smart Contract: Solidity 0.8.20, OpenZeppelin, Chainlink
- Frontend: Next.js 14+, TypeScript 5+, Vite, pnpm
- 3D Rendering: Three.js ^0.160.0
- Blockchain: Wagmi ^2.0.0, Viem ^2.0.0, Ethers.js ^6.9.0
- IPFS: Pinata SDK

### 체크포인트
- [ ] Phase 2 완료 후: 스마트 컨트랙트 테스트넷 배포 및 검증
- [ ] Phase 4 완료 후: 3D 렌더링 시각적 확인
- [ ] Phase 6 완료 후: 전체 민팅 플로우 동작 확인

---

**최종 업데이트**: 2025-11-15

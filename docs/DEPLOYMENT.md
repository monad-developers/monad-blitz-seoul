# 배포 체크리스트

## 🔧 스마트 컨트랙트

### 개발 환경 설정
- [ ] Hardhat 프로젝트 설정
  ```bash
  npm init -y
  npm install --save-dev hardhat
  npx hardhat init
  ```
- [ ] OpenZeppelin 컨트랙트 설치
  ```bash
  npm install @openzeppelin/contracts
  ```
- [ ] Chainlink 컨트랙트 설치
  ```bash
  npm install @chainlink/contracts
  ```

### 컨트랙트 개발
- [ ] `TraitGenerator.sol` 라이브러리 작성
- [ ] `MinecraftPFPWithWealth.sol` 컨트랙트 작성
- [ ] 단위 테스트 작성 (최소 80% 커버리지)
- [ ] 통합 테스트 작성
- [ ] 가스 최적화 검증

### Price Feed 확인
- [ ] Mainnet price feed 주소 확인
  - ETH/USD: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
  - USDT/USD: `0x3E7d1eAB13ad0104d273B42c5c5a4e3F3A9b6d3e`
  - USDC/USD: `0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6`

- [ ] Sepolia testnet price feed 주소 확인
  - ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
  - USDT/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`
  - USDC/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`

### 배포
- [ ] Testnet 배포 (Sepolia)
  ```bash
  npx hardhat run scripts/deploy.ts --network sepolia
  ```
- [ ] Testnet 검증
  ```bash
  npx hardhat verify --network sepolia CONTRACT_ADDRESS
  ```
- [ ] Mainnet 배포 (프로덕션)
  ```bash
  npx hardhat run scripts/deploy.ts --network mainnet
  ```
- [ ] Mainnet 검증
  ```bash
  npx hardhat verify --network mainnet CONTRACT_ADDRESS
  ```

### 보안
- [ ] 보안 감사 실시
- [ ] Slither 정적 분석
  ```bash
  pip install slither-analyzer
  slither .
  ```
- [ ] Mythril 취약점 스캔
  ```bash
  pip install mythril
  myth analyze contracts/MinecraftPFPWithWealth.sol
  ```

---

## 💻 프론트엔드

### 프로젝트 설정
- [ ] Next.js 프로젝트 생성
  ```bash
  npx create-next-app@latest minecraft-pfp-frontend --typescript
  ```
- [ ] 필수 패키지 설치
  ```bash
  npm install three gif.js pinata-web3 ethers wagmi viem
  npm install --save-dev @types/three
  ```

### 개발
- [ ] Three.js 렌더링 시스템 구현
- [ ] GIF 생성 파이프라인 구현
- [ ] IPFS 업로드 기능 구현
- [ ] 지갑 연결 구현 (RainbowKit/ConnectKit)
- [ ] 미리보기 페이지 구현
- [ ] 민팅 페이지 구현
- [ ] 갤러리 페이지 구현

### 환경 변수 설정
- [ ] `.env.local` 파일 생성
  ```env
  NEXT_PUBLIC_CONTRACT_ADDRESS=
  NEXT_PUBLIC_PINATA_JWT=
  NEXT_PUBLIC_PINATA_GATEWAY=
  NEXT_PUBLIC_RPC_URL=
  NEXT_PUBLIC_CHAIN_ID=
  ```

### 테스트
- [ ] UI/UX 테스트
- [ ] 지갑 연결 테스트
- [ ] 민팅 플로우 E2E 테스트
- [ ] 모바일 반응형 테스트
- [ ] 브라우저 호환성 테스트

### 빌드 및 배포
- [ ] 프로덕션 빌드
  ```bash
  npm run build
  ```
- [ ] Vercel/Netlify 배포
  ```bash
  vercel deploy --prod
  ```
- [ ] 도메인 연결
- [ ] SSL 인증서 확인

---

## 🎨 3D 에셋

### 기본 모델
- [ ] 마인크래프트 스킨 베이스 모델 제작
  - 머리 (8x8x8)
  - 몸통 (8x12x4)
  - 팔 (4x12x4) x2
  - 다리 (4x12x4) x2

### Special Items 모델 (19개)
#### Bronze Tier
- [ ] 1. Wooden Sword
- [ ] 2. Leather Cape
- [ ] 3. Iron Shield

#### Silver Tier
- [ ] 4. Steel Sword
- [ ] 5. Silver Crown
- [ ] 6. Magic Staff

#### Gold Tier
- [ ] 7. Golden Sword
- [ ] 8. Golden Crown
- [ ] 9. Wings
- [ ] 10. Enchanted Book

#### Platinum Tier
- [ ] 11. Diamond Sword
- [ ] 12. Platinum Armor
- [ ] 13. Angel Wings
- [ ] 14. Mystic Orb

#### Diamond Tier
- [ ] 15. Legendary Blade
- [ ] 16. Dragon Wings
- [ ] 17. Celestial Crown
- [ ] 18. Infinity Gauntlet
- [ ] 19. God Armor Set

### 효과
- [ ] 파티클 시스템 구현
- [ ] 오라 효과 구현 (무지개, 불, 별, 우주, 신성)
- [ ] 애니메이션 리그 설정

---

## ☁️ 인프라

### IPFS/Pinata
- [ ] Pinata 계정 생성
- [ ] API 키 발급
- [ ] Gateway URL 확인
- [ ] 업로드 테스트

### RPC 엔드포인트
- [ ] Infura 계정 및 API 키
  - 또는 Alchemy
  - 또는 QuickNode
- [ ] Rate limit 확인
- [ ] Fallback RPC 설정

### 호스팅
- [ ] 도메인 구매
- [ ] DNS 설정
- [ ] CDN 설정 (Cloudflare)
- [ ] IPFS 게이트웨이 커스텀 도메인

---

## 🧪 테스트

### 스마트 컨트랙트 테스트
- [ ] 단위 테스트
  - [ ] Trait 생성 로직
  - [ ] 자산 계산 로직
  - [ ] Tier 결정 로직
  - [ ] 민팅 로직
  - [ ] 권한 검증

- [ ] 통합 테스트
  - [ ] Chainlink Price Feed 통합
  - [ ] ERC20 토큰 통합
  - [ ] IPFS URI 저장

- [ ] Testnet 테스트
  - [ ] 실제 민팅 테스트
  - [ ] 가스비 측정
  - [ ] 이벤트 확인

### 프론트엔드 테스트
- [ ] 기능 테스트
  - [ ] 지갑 연결/해제
  - [ ] 미리보기 생성
  - [ ] GIF 생성
  - [ ] IPFS 업로드
  - [ ] 민팅 트랜잭션

- [ ] 성능 테스트
  - [ ] 3D 렌더링 성능
  - [ ] GIF 생성 시간
  - [ ] 로딩 시간

- [ ] 부하 테스트
  - [ ] 동시 민팅 시뮬레이션
  - [ ] IPFS 업로드 동시성

---

## 📊 모니터링

### 온체인 모니터링
- [ ] Etherscan 알림 설정
- [ ] 민팅 이벤트 추적
- [ ] 가스비 모니터링

### 오프체인 모니터링
- [ ] 프론트엔드 에러 트래킹 (Sentry)
- [ ] 성능 모니터링 (Vercel Analytics)
- [ ] IPFS 업타임 모니터링

---

## 🔐 보안 체크리스트

### 스마트 컨트랙트
- [ ] 재진입 공격 방지
- [ ] Integer overflow/underflow 방지
- [ ] Access control 검증
- [ ] Price feed 유효성 검증
- [ ] Reentrancy guard

### 프론트엔드
- [ ] API 키 환경 변수 관리
- [ ] XSS 방지
- [ ] CSRF 방지
- [ ] Rate limiting

### 인프라
- [ ] HTTPS 강제
- [ ] CORS 설정
- [ ] API 키 로테이션

---

## 📝 문서화

### 기술 문서
- [ ] README.md
- [ ] API 문서
- [ ] 아키텍처 문서
- [ ] 배포 가이드

### 사용자 문서
- [ ] 사용자 가이드
- [ ] FAQ
- [ ] 트러블슈팅 가이드

---

## 🚀 런칭

### Pre-launch
- [ ] Testnet 베타 테스트
- [ ] 커뮤니티 피드백 수집
- [ ] 버그 수정
- [ ] 최종 보안 감사

### Launch
- [ ] Mainnet 배포
- [ ] 공식 발표
- [ ] 소셜 미디어 캠페인
- [ ] OpenSea 컬렉션 생성

### Post-launch
- [ ] 모니터링 시작
- [ ] 사용자 피드백 수집
- [ ] 핫픽스 준비
- [ ] 향후 로드맵 공개

---

## 🎯 최종 검증

### 기능 검증
- [ ] 지갑 연결 작동
- [ ] 미리보기 정확성
- [ ] 민팅 성공률 100%
- [ ] 메타데이터 정확성
- [ ] 이미지 로딩 정상

### 성능 검증
- [ ] 페이지 로딩 < 3초
- [ ] GIF 생성 < 30초
- [ ] 민팅 트랜잭션 < 2분
- [ ] 가스비 합리적

### 호환성 검증
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers
- [ ] MetaMask
- [ ] WalletConnect
- [ ] Coinbase Wallet

---

## 📞 긴급 대응

### 긴급 연락망
- [ ] 개발팀 연락처 정리
- [ ] 보안팀 연락처
- [ ] 인프라 담당자

### 긴급 절차
- [ ] 컨트랙트 일시 정지 절차
- [ ] 롤백 절차
- [ ] 공지 프로세스

### 백업
- [ ] 코드 백업
- [ ] 데이터베이스 백업 (해당 시)
- [ ] 설정 파일 백업

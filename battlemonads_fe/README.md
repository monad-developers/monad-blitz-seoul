# 🔥 BattleMonads - Frontend

**Real-time price-based monster battles powered by Chainlink Data Feeds on Monad blockchain**

Battle Monads는 Chainlink 가격 데이터와 Monad 블록체인을 활용한 실시간 예측 시장 기반 PvP 배틀 게임입니다.

## 🎮 게임 개요

- **블록체인**: Monad Testnet (Chain ID: 10143)
- **오라클**: Chainlink Data Feeds (BTC/USD, ETH/USD)
- **배틀 시간**: 12시간
- **베팅 범위**: 0.01 ~ 1 MON
- **특별 기능**: Discord 프로필 연동, 실시간 댓글 & 공격 시스템

## 🚀 빠른 시작

### 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 환경 변수

`.env.local` 파일에 다음 변수들을 설정하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 게임을 플레이할 수 있습니다.

## 🏗️ 기술 스택

### 프론트엔드
- **Framework**: Next.js 15.5.2 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks

### Web3 & 블록체인
- **Web3 Library**: Wagmi v2.16.9
- **Blockchain**: Monad Testnet
- **Wallet**: MetaMask 연동
- **Smart Contracts**: Solidity (Foundry)

### 백엔드 & 인증
- **Database**: Supabase
- **Authentication**: Supabase Auth (Discord OAuth)
- **Real-time**: Supabase Realtime

### 배포 & 도구
- **Deployment**: Vercel
- **Development**: ESLint, Prettier
- **Package Manager**: npm

## 📁 프로젝트 구조

```
battlemonads_fe/
├── app/
│   ├── components/          # UI 컴포넌트들
│   │   ├── ui/             # 재사용 가능한 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── Header.tsx      # 네비게이션 & 지갑 연결
│   │   ├── BattleArena.tsx # 메인 배틀 화면
│   │   ├── BettingPanel.tsx # 베팅 인터페이스
│   │   ├── CommentSection.tsx # 댓글 & 공격 시스템
│   │   ├── Monster.tsx     # 몬스터 카드 컴포넌트
│   │   └── PriceTicker.tsx # 실시간 가격 표시
│   ├── hooks/              # 커스텀 훅들
│   │   ├── useBattleMonads.ts  # 메인 게임 로직
│   │   └── usePriceFeeds.ts    # 가격 데이터 훅
│   ├── lib/                # 라이브러리 & 유틸리티
│   │   ├── contracts/      # 스마트 컨트랙트 ABI
│   │   └── supabase/       # Supabase 클라이언트
│   ├── providers/          # Context Provider들
│   │   ├── WagmiProvider.tsx   # Web3 설정
│   │   └── SupabaseProvider.tsx # 인증 & DB
│   ├── config/             # 설정 파일들
│   │   └── wagmi.ts        # Wagmi 설정
│   ├── globals.css         # 글로벌 스타일
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx            # 메인 페이지
├── public/                 # 정적 파일들
├── next.config.ts          # Next.js 설정
├── tailwind.config.ts      # Tailwind 설정
└── package.json            # 의존성 관리
```

## 🎯 주요 기능

### 🔗 Web3 통합
- **지갑 연결**: MetaMask를 통한 Monad 테스트넷 연결
- **자동 네트워크 전환**: 잘못된 네트워크 감지 시 자동 전환
- **실시간 잔액**: MON 토큰 잔액 실시간 표시
- **트랜잭션 상태**: 베팅 및 댓글 트랜잭션 상태 추적

### 🏟️ 배틀 시스템
- **12시간 배틀**: 실시간 카운트다운 타이머
- **ETH vs BTC**: 두 몬스터 간의 가격 예측 배틀
- **실시간 HP**: 공격으로 인한 HP 변화 즉시 반영
- **승부 결정**: HP 0 또는 시간 만료 시 자동 정산

### 💰 베팅 시스템
- **범위**: 0.01 ~ 1 MON
- **실시간 풀**: ETH/BTC 베팅 풀 실시간 업데이트
- **승률 계산**: 동적 배당률 표시
- **자동 정산**: 승자 풀에 베팅 비율 기반 분배

### 💬 소셜 기능
- **Discord 연동**: OAuth를 통한 간편 로그인
- **프로필 매핑**: 지갑 주소-Discord 계정 자동 연결
- **실시간 댓글**: 베팅 참여자만 댓글 작성 가능
- **공격 시스템**: "attack" 키워드로 상대 몬스터 공격 (-1 HP)

### 📊 실시간 데이터
- **Chainlink 가격**: BTC/USD, ETH/USD 실시간 가격
- **가격 변화**: 24시간 변화율 및 변화량 표시
- **배틀 현황**: 몬스터 HP, 베팅 풀 실시간 업데이트

## 🔧 배포된 컨트랙트

### Monad 테스트넷
- **PriceFeeds Contract**: `0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd`
- **BattleMonads Contract**: `0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d`
- **Explorer**: [Monad Testnet Explorer](https://testnet.monadscan.com/)

## 🎮 게임 플레이 가이드

### 1단계: 지갑 연결
1. MetaMask 설치 및 Monad 테스트넷 추가
2. 테스트넷 MON 토큰 획득
3. "Connect MetaMask" 버튼 클릭

### 2단계: Discord 로그인
1. "Discord Login" 버튼 클릭
2. Discord 계정으로 OAuth 인증
3. 지갑 주소 자동 매핑

### 3단계: 베팅 참여
1. ETH 또는 BTC 몬스터 선택
2. 베팅 금액 입력 (0.01-1 MON)
3. "Place Bet" 버튼 클릭하여 트랜잭션 전송

### 4단계: 배틀 참여
1. 댓글 작성으로 커뮤니티 참여
2. "attack" 키워드 포함으로 상대 공격
3. 실시간 배틀 현황 관찰

### 5단계: 보상 획득
1. 배틀 종료 시 자동 정산
2. 승자 풀 베팅 비율에 따른 보상 분배

## 🛠️ 개발 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 실행
npm start

# 타입 체크
npm run type-check

# 린팅
npm run lint

# 코드 포맷팅
npm run format
```

## 🔍 주요 컴포넌트

### BattleArena
메인 배틀 화면으로 다음 기능을 제공합니다:
- 실시간 12시간 카운트다운
- 몬스터 HP 및 상태 표시
- 베팅 풀 현황 시각화
- 프로그레스 바 애니메이션

### BettingPanel
베팅 인터페이스:
- 몬스터 선택 (ETH/BTC)
- 베팅 금액 입력 및 검증
- 네트워크 자동 전환
- 트랜잭션 상태 피드백

### CommentSection
소셜 상호작용:
- Discord 프로필 이미지 표시
- 실시간 댓글 시스템
- 공격 키워드 감지
- 최신순 댓글 정렬

### PriceTicker
가격 정보 표시:
- Chainlink 실시간 가격
- 24시간 변화율
- 시각적 가격 트렌드

## 🌐 네트워크 설정

### Monad 테스트넷 정보
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Explorer**: https://testnet.monadscan.com/
- **Symbol**: MON

### MetaMask에 네트워크 추가
```json
{
  "chainId": "0x279F",
  "chainName": "Monad Testnet",
  "rpcUrls": ["https://testnet-rpc.monad.xyz"],
  "nativeCurrency": {
    "name": "Monad",
    "symbol": "MON",
    "decimals": 18
  },
  "blockExplorerUrls": ["https://testnet.monadscan.com/"]
}
```

## 🛠️ 개발 환경 설정

### 필수 조건
- Node.js 18.0.0 이상
- npm 또는 yarn
- MetaMask 브라우저 확장

### Supabase 설정
1. [Supabase](https://supabase.com) 프로젝트 생성
2. Discord OAuth 설정:
   - Discord Developer Portal에서 애플리케이션 생성
   - OAuth2 redirect URL 설정
3. 유저 프로필 테이블 생성:
```sql
CREATE TABLE user_profiles (
  wallet_address TEXT PRIMARY KEY,
  discord_id TEXT,
  username TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 배포

### Vercel 배포
1. GitHub 리포지토리 연결
2. 환경 변수 설정
3. 자동 배포 실행

### 환경 변수 (Production)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 🐛 트러블슈팅

### 일반적인 문제

**1. 지갑 연결 실패**
- MetaMask 설치 확인
- Monad 테스트넷 네트워크 추가
- 브라우저 새로고침

**2. 베팅 트랜잭션 실패**
- MON 토큰 잔액 확인 (최소 0.01 + 가스비)
- 네트워크 연결 상태 확인
- 가스 한도 설정 확인

**3. 댓글 작성 불가**
- 해당 배틀에 베팅 참여 확인
- Discord 로그인 상태 확인
- 지갑 연결 상태 확인

**4. 실시간 업데이트 안됨**
- 브라우저 새로고침
- Supabase 연결 상태 확인
- 네트워크 연결 확인

### 개발 중 발생할 수 있는 이슈

**Hydration Mismatch**
```javascript
// 해결: mounted 상태로 SSR/CSR 차이 처리
const [mounted, setMounted] = useState(false);
useEffect(() => {
  setMounted(true);
}, []);
```

**Network Switching**
```javascript
// 해결: useSwitchChain 훅 사용
const { switchChain } = useSwitchChain();
if (chainId !== monadTestnet.id) {
  await switchChain({ chainId: monadTestnet.id });
}
```

## 📖 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Wagmi 문서](https://wagmi.sh)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase 문서](https://supabase.com/docs)
- [Monad 문서](https://docs.monad.xyz)
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)

## 🎯 라이브 데모

**🔗 [battlemonads.vercel.app](https://battlemonads.vercel.app)**

Discord와 MetaMask를 준비하고 Monad 테스트넷에서 배틀에 참여하세요!

---

## 👥 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

**⚔️ May the best monster win! ⚔️**
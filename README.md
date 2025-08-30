# 🔥 BattleMonads

**Real-time price-based monster battles powered by Chainlink Data Feeds on Monad blockchain**

BattleMonads는 Chainlink 가격 데이터와 Monad 블록체인을 활용한 혁신적인 실시간 예측 시장 기반 PvP 배틀 게임입니다. 플레이어들은 ETH vs BTC 몬스터 배틀에서 원하는 몬스터에 베팅하고, Discord 커뮤니티와 함께 실시간으로 상호작용하며 배틀의 결과에 영향을 미칠 수 있습니다.

## 🎮 게임 개요

### 핵심 콘셉트
- **실시간 배틀**: ETH 🦄 vs BTC 🦁 몬스터 12시간 배틀
- **예측 시장**: 0.01-1 MON 베팅으로 배틀 결과 예측
- **소셜 인터랙션**: Discord 연동 댓글 & 공격 시스템
- **데이터 중심**: Chainlink Data Feeds로 실시간 가격 반영

### 게임 플로우
1. **배틀 생성**: 관리자가 ETH vs BTC 몬스터 배틀 개설
2. **베팅 참여**: 플레이어가 승리할 것으로 예상되는 몬스터에 베팅
3. **커뮤니티 참여**: Discord 로그인 후 댓글 작성 및 공격 참여
4. **실시간 배틀**: 12시간 동안 몬스터 HP, 베팅 풀 변화 관찰
5. **자동 정산**: 배틀 종료 시 승자 풀에 베팅 비율 기반 보상 분배

## 🏗️ 기술 아키텍처

### 블록체인 스택
- **메인체인**: Monad Testnet (Chain ID: 10143)
- **스마트 컨트랙트**: Solidity + Foundry
- **오라클**: Chainlink Data Feeds (BTC/USD, ETH/USD)
- **개발 도구**: Foundry, Cast, Anvil

### 프론트엔드 스택
- **프레임워크**: Next.js 15.5.2 (App Router, Turbopack)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **Web3**: Wagmi v2.16.9
- **상태 관리**: React Hooks

### 백엔드 & 인증
- **데이터베이스**: Supabase
- **인증**: Discord OAuth (Supabase Auth)
- **실시간 통신**: Supabase Realtime
- **배포**: Vercel

## 🎯 주요 기능

### 🔗 Web3 통합
- **지갑 연결**: MetaMask를 통한 Monad 테스트넷 자동 연결
- **네트워크 전환**: 잘못된 네트워크 감지 시 자동 전환
- **실시간 잔액**: MON 토큰 잔액 실시간 표시
- **트랜잭션 추적**: 베팅 및 댓글 트랜잭션 상태 실시간 피드백

### 🏟️ 배틀 시스템
- **12시간 배틀**: 실시간 카운트다운 타이머 (일/시/분/초 표시)
- **몬스터 대결**: ETH 유니콘 🦄 vs BTC 라이온 🦁
- **HP 시스템**: 각 100 HP로 시작, 공격으로 -1 HP 감소
- **승부 조건**: HP 0 또는 12시간 만료 시 자동 정산

### 💰 베팅 & 경제 시스템
- **베팅 범위**: 0.01 ~ 1 MON (Monad 네이티브 토큰)
- **실시간 풀**: ETH/BTC 베팅 풀 실시간 업데이트
- **동적 배당**: 베팅 풀 비율에 따른 동적 승률 계산
- **자동 정산**: 승자 풀 참여자들에게 베팅 비율 기반 보상 분배

### 💬 소셜 & 커뮤니티
- **Discord 통합**: OAuth를 통한 원클릭 로그인
- **프로필 매핑**: 지갑 주소와 Discord 계정 자동 연결
- **실시간 댓글**: 베팅 참여자만 댓글 작성 권한
- **공격 메커니즘**: "attack" 키워드로 상대 몬스터 공격 (-1 HP)
- **프로필 표시**: Discord 아바타 이미지 실시간 표시

### 📊 데이터 & 오라클
- **Chainlink 가격**: BTC/USD, ETH/USD 실시간 가격 피드
- **가격 변화**: 24시간 변화율 및 절대 변화량 표시
- **배틀 현황**: 몬스터 HP, 베팅 풀, 댓글 수 실시간 업데이트
- **시각적 피드백**: 프로그레스 바, 그라데이션 애니메이션

## 🔧 스마트 컨트랙트

### 배포된 컨트랙트 (Monad Testnet)
- **PriceFeeds Contract**: [`0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd`](https://testnet.monadscan.com/address/0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd)
- **BattleMonads Contract**: [`0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d`](https://testnet.monadscan.com/address/0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d)

### 컨트랙트 설정
```solidity
uint256 public constant MIN_BET = 0.01 ether;    // 최소 베팅: 0.01 MON
uint256 public constant MAX_BET = 1 ether;       // 최대 베팅: 1 MON
uint256 public constant BATTLE_DURATION = 12 hours; // 배틀 지속시간: 12시간
uint256 public constant DEFAULT_HP = 100;        // 몬스터 기본 HP: 100
```

### 주요 함수
- `bet(battleId, side)`: 몬스터에 베팅
- `addComment(battleId, content)`: 댓글 작성 (베팅자만 가능)
- `getBattle(battleId)`: 배틀 정보 조회
- `canUserComment(battleId, user)`: 댓글 권한 확인

## 🌐 네트워크 정보

### Monad Testnet
- **Chain ID**: 10143 (0x279F)
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Block Explorer**: https://testnet.monadscan.com/
- **Native Token**: MON (18 decimals)

### Chainlink Data Feeds
| Asset | Feed Address | Decimals |
|-------|-------------|----------|
| BTC/USD | `0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31` | 8 |
| ETH/USD | `0x0c76859E85727683Eeba0C70Bc2e0F5781337818` | 8 |

## 📁 프로젝트 구조

```
monad-blitz-seoul/
├── README.md                    # 프로젝트 개요 (현재 파일)
├── prd.md                       # 상세 제품 요구사항
├── chainlink-data-feeds.md      # Chainlink 통합 가이드
├── data-structures.md           # 게임 데이터 구조
├── CLAUDE.md                    # AI 컨텍스트 문서
├── battlemonads_contract/       # 스마트 컨트랙트
│   ├── src/
│   │   ├── BattleMonads.sol    # 메인 배틀 컨트랙트
│   │   └── PriceFeeds.sol      # Chainlink 가격 피드
│   ├── script/                 # 배포 스크립트
│   ├── test/                   # 컨트랙트 테스트
│   └── README.md               # 컨트랙트 문서
└── battlemonads_fe/             # 프론트엔드 앱
    ├── app/
    │   ├── components/         # React 컴포넌트
    │   ├── hooks/             # 커스텀 훅
    │   ├── lib/               # 유틸리티
    │   └── providers/         # Context Provider
    ├── public/                # 정적 파일
    └── README.md              # 프론트엔드 문서
```

## 🎯 Monad 블록체인 활용

### 고성능 특징 활용
- **10,000+ TPS**: 빈번한 베팅과 댓글 트랜잭션 처리
- **0.5초 블록 타임**: 실시간 배틀 현황 빠른 반영
- **단일 슬롯 파이널리티**: 트랜잭션 즉시 확정
- **EVM 호환성**: 기존 이더리움 생태계 도구 활용

### 게임에 특화된 기능
- **실시간 베팅**: 높은 TPS로 동시 다발적 베팅 처리
- **댓글 & 공격**: 빠른 블록 타임으로 실시간 상호작용
- **자동 정산**: 스마트 컨트랙트 자동 실행으로 공정한 보상 분배

## 🏆 혁신적인 게임 요소

### 1. 데이터 중심 게임플레이
- Chainlink를 통한 실제 금융 데이터 게임 접목
- 가격 변동성이 게임 전략에 직접적 영향
- 외부 데이터와 게임 세계의 완전한 통합

### 2. 소셜 예측 시장
- Discord 커뮤니티와 게임의 완전한 통합
- 베팅 참여자만의 독점 커뮤니티 형성
- 댓글과 공격을 통한 능동적 게임 참여

### 3. 실시간 경쟁 요소
- 12시간 동안 지속되는 긴장감 있는 배틀
- 실시간 HP 변화와 베팅 풀 변동 관찰
- 커뮤니티 참여도가 배틀 결과에 직접 영향

### 4. 투명한 경제 시스템
- 스마트 컨트랙트 기반 완전 투명한 베팅 시스템
- 승자 풀 자동 분배로 공정성 보장
- 실시간 배당률 계산으로 정보 투명성 제공

## 🚀 라이브 데모

**🎮 [battlemonads.vercel.app](https://battlemonads.vercel.app)**

### 플레이 준비사항
1. **MetaMask 설치** 및 Monad 테스트넷 추가
2. **Discord 계정** 준비
3. **테스트넷 MON 토큰** 획득 (최소 0.1 MON 권장)

### 즉시 플레이 가능
- 지갑 연결 → Discord 로그인 → 베팅 참여 → 커뮤니티 참여

---

## 📋 프로젝트 문서

상세한 프로젝트 정보는 다음 문서들을 참고하세요:

- **[`prd.md`](./prd.md)** - 상세 제품 요구사항 문서
- **[`chainlink-data-feeds.md`](./chainlink-data-feeds.md)** - Chainlink Data Feeds 통합 가이드  
- **[`data-structures.md`](./data-structures.md)** - 게임 데이터 구조 설계
- **[`CLAUDE.md`](./CLAUDE.md)** - AI 개발 도우미를 위한 컨텍스트 문서
- **[`battlemonads_contract/README.md`](./battlemonads_contract/README.md)** - 스마트 컨트랙트 문서
- **[`battlemonads_fe/README.md`](./battlemonads_fe/README.md)** - 프론트엔드 문서

## 🏅 Monad Blitz Seoul 2025

이 프로젝트는 **Monad Blitz Seoul 2025** 해커톤 프로덕트입니다.

### 핵심 가치 제안
- **Monad의 고성능 활용**: 10,000+ TPS로 실시간 게임 구현
- **Chainlink 생태계 통합**: 실제 데이터를 게임에 완전 통합
- **혁신적인 게임 디자인**: 예측 시장 + 소셜 게임 + 실시간 배틀의 융합
- **완성된 제품**: 즉시 플레이 가능한 완전한 게임 경험

---

**⚔️ May the best monster win! ⚔️**

*Built with ❤️ by the BattleMonads team for Monad Blitz Seoul 2025*
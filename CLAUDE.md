# Claude AI 개발 도우미를 위한 컨텍스트 문서

## 프로젝트 개요
예측 기반 '몬스터 배틀' NFT 게임 - Monad 블록체인과 Chainlink Data Feeds를 활용한 예측 시장 기반 PvP 게임

## 프로젝트 구조
```
monad-blitz-seoul/
├── README.md           # 프로젝트 소개 및 문서 목록
├── prd.md             # 상세 제품 요구사항 문서
├── chainlink-data-feeds.md  # Chainlink 통합 가이드
├── data-structures.md  # 게임 데이터 구조 설계
└── CLAUDE.md          # 현재 문서
```

## 핵심 기술 스택
- **블록체인**: Monad (EVM 호환, 10,000+ TPS)
- **오라클**: Chainlink Data Feeds, Chainlink Functions
- **스마트 컨트랙트**: Solidity
- **NFT**: ERC-721 기반 몬스터 NFT

## 주요 컴포넌트

### 1. 몬스터 NFT 시스템
- ERC-721 기반 몬스터 민팅
- Chainlink VRF를 통한 랜덤 속성 생성
- 타입: Fire, Water, Earth, Air, Crypto
- 기본 스탯: HP, ATK, DEF, SPD

### 2. 예측 이슈 시스템
- 가격 예측 (ETH, BTC 등)
- 금융 지수 예측 (나스닥, S&P500)
- 날씨/환경 예측
- 커뮤니티 이슈

### 3. 스테이킹 메커니즘
- YES/NO 이분법 풀
- 동적 배당률 계산
- 7-30일 락업 기간
- $MONSTER 토큰 보상

### 4. 배틀 시스템
- 실시간 데이터 기반 보너스
- 스테이킹 성과 반영
- PvP 매칭

## 사용 가능한 Chainlink Data Feeds

### 암호화폐 가격
- BTC/USD, ETH/USD, LINK/USD
- ETH/LINK (가스비 변환용)

### 금융 지수 (Chainlink Functions 활용)
- 나스닥 종합지수
- S&P 500
- VIX 변동성 지수

### 날씨 데이터 (Chainlink Functions 활용)
- 온도, 날씨 상태, 습도
- 주요 도시별 실시간 정보

## 스마트 컨트랙트 구조
1. **MonsterNFT Contract**: 몬스터 생성 및 관리
2. **PredictionMarket Contract**: 예측 이슈 및 스테이킹
3. **DataOracle Contract**: Chainlink 통합
4. **Battle Contract**: 배틀 로직
5. **Token Contract**: $MONSTER 토큰

## 개발 시 참고사항

### Monad 특징
- EVM 1:1 호환
- 10,000+ TPS
- 0.5초 블록 타임
- 단일 슬롯 파이널리티

### Chainlink Functions 사용
```javascript
// 날씨 데이터 수집 예시
const weatherApiUrl = "https://api.weather.com/v1/location/";
const response = await Functions.makeHttpRequest({
  url: weatherApiUrl,
  headers: { "API-Key": secrets.weatherApiKey }
});
```

### 게임 로직 핵심
- 예측 시장 결과가 몬스터 성장에 직접 영향
- 실시간 외부 데이터가 배틀 결과 좌우
- 커뮤니티 참여도가 게임 경제 활성화

## 개발 우선순위
1. 기본 NFT 민팅 시스템
2. Chainlink Data Feeds 통합
3. 예측 시장 스마트 컨트랙트
4. 배틀 시스템 구현
5. 토크노믹스 및 보상 시스템

## 테스트 환경
- Monad Testnet 사용 예정
- Chainlink Functions Router 주소 필요
- 테스트용 LINK 토큰 필요

## 추가 리소스
- [Monad 공식 문서](https://docs.monad.xyz/)
- [Chainlink 문서](https://docs.chain.link/)
- [Solidity 문서](https://docs.soliditylang.org/)

## 현재 작업 상태
- ✅ PRD 작성 완료
- ✅ Chainlink Data Feeds 조사 완료
- ✅ 데이터 구조 설계 완료
- ⏳ 스마트 컨트랙트 개발 예정
- ⏳ 프론트엔드 개발 예정
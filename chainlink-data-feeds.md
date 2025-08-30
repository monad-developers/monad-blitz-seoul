# Chainlink Data Feeds for Monad Monster Battle Game

## 1. Monad x Chainlink 통합 현황

Monad는 2025년 4월 Chainlink Scale 프로그램에 합류했으며, 다음 서비스들이 통합될 예정입니다:
- **Chainlink Data Feeds**: 다양한 자산 클래스의 가격 데이터
- **Chainlink CCIP**: 크로스체인 상호운용성
- **Chainlink Data Streams**: 저지연 데이터 스트리밍
- **Proof of Reserve Feeds**: 자산 보유 증명

Monad는 10,000+ TPS와 0.5초 블록 타임을 제공하는 고성능 EVM 호환 L1 체인으로, Chainlink의 데이터 피드를 통해 DeFi 혁신을 가속화할 예정입니다.

## 2. 가격 데이터 피드 (Crypto)

### 주요 암호화폐 가격 피드
- **BTC/USD**: 비트코인 가격 피드
- **ETH/USD**: 이더리움 가격 피드
- **LINK/USD**: 체인링크 토큰 가격 피드
- **ETH/LINK**: ETH-LINK 페어 (가스비 LINK 변환용)

### API를 통한 가격 데이터 수집 예시
Chainlink Functions를 사용하여 다음 API들로부터 데이터 수집 가능:
- CoinMarketCap API
- CoinGecko API
- CoinPaprika API

## 3. 금융 지수 데이터 피드

현재 Chainlink Functions를 통해 외부 API 호출로 구현 가능한 데이터:
- **나스닥 종합지수**: API를 통한 실시간 데이터 수집
- **S&P 500**: 주식 시장 지수 데이터
- **VIX 변동성 지수**: 시장 변동성 지표

**참고**: 전통 금융 지수는 직접적인 온체인 피드보다는 Chainlink Functions를 통한 오프체인 API 호출로 구현됩니다.

## 4. 날씨/환경 데이터 피드

Chainlink Functions를 활용한 날씨 데이터 수집:
- **온도 데이터**: 특정 도시의 실시간 온도
- **날씨 상태**: 맑음/비/눈 등의 기상 정보
- **습도/기압**: 환경 데이터

### 구현 방법
```javascript
// Chainlink Functions를 통한 날씨 API 호출 예시
const weatherApiUrl = "https://api.weather.com/v1/location/";
const response = await Functions.makeHttpRequest({
  url: weatherApiUrl,
  headers: { "API-Key": secrets.weatherApiKey }
});
```

## 5. 게임 내 활용 방안

### 가격 데이터 활용
- ETH 가격 상승률 > 5% → Crypto 타입 몬스터 ATK +10%
- BTC 신고가 달성 → 모든 몬스터 DEF +5%
- 스테이블코인 변동 → Water 타입 몬스터 SPD 조정

### 예측 이슈 생성
- "7일 후 ETH 가격이 $3000 이상일까?"
- "BTC가 다음 주까지 $50000을 돌파할까?"

### 날씨 기반 보너스
- 맑은 날씨 → Fire 타입 ATK +20%, Water 타입 ATK -10%
- 비/눈 → Water 타입 SPD +25%, Fire 타입 SPD -15%

## 6. 기술 구현 정보

### Chainlink Functions Router Addresses (예시)
- Ethereum Sepolia: `0xb83E47C2bC239B3bf370bc41e1459A34b41238D0`
- Polygon Mainnet: `0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73F10`
- Arbitrum Mainnet: `0x97083e831f8f0638855e2a515c90edcf158df238`
- Base Mainnet: `0xf9b8fc078197181c841c296c876945aaa425b278`

### DON ID
모든 체인에서 공통: `fun-[network]-[mainnet/testnet]-1`

## 7. 구현 시 고려사항

1. **실시간 데이터 업데이트**: Monad의 높은 TPS를 활용하여 빈번한 데이터 업데이트 가능
2. **가스 최적화**: Chainlink Functions 호출 시 가스비 고려
3. **데이터 검증**: 오라클 데이터의 신뢰성 확보를 위한 다중 소스 활용
4. **캐싱 전략**: 불필요한 API 호출 최소화를 위한 데이터 캐싱

## 8. 추가 리소스

- [Chainlink Documentation](https://docs.chain.link/)
- [Chainlink Functions Guide](https://docs.chain.link/chainlink-functions)
- [Price Feeds Contract Addresses](https://docs.chain.link/data-feeds/price-feeds/addresses)
- [Monad Official Website](https://monad.xyz/)
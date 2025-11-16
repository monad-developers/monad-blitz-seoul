# PriceOracleAdapter 초기 설정 가이드

PriceOracleAdapter를 배포한 후, 가격 피드를 설정해야 합니다.

## 방법 1: 자동 설정 스크립트 사용 (권장)

### 1. .env 파일에 설정 추가

```bash
# 배포된 PriceOracleAdapter 주소
ORACLE_ADDRESS=0x...

# 토큰 주소와 가격 피드 주소
WETH_ADDRESS=0x...
WETH_USD_FEED=0x...
USDC_ADDRESS=0x...
USDC_USD_FEED=0x...
```

### 2. 설정 스크립트 실행

```bash
cd monad_contracts
source .env

forge script script/SetupPriceOracle.s.sol:SetupPriceOracle \
  --rpc-url monad_testnet \
  --broadcast \
  -vvvv
```

## 방법 2: 수동 설정 (cast 사용)

### WETH/USD 피드 설정

```bash
cast send $ORACLE_ADDRESS \
  "setPriceFeed(address,address)" \
  $WETH_ADDRESS \
  $WETH_USD_FEED \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

### USDC/USD 피드 설정

```bash
cast send $ORACLE_ADDRESS \
  "setPriceFeed(address,address)" \
  $USDC_ADDRESS \
  $USDC_USD_FEED \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 일괄 설정 (여러 피드 한번에)

```bash
# 토큰 주소 배열
TOKENS="[$WETH_ADDRESS,$USDC_ADDRESS]"

# 피드 주소 배열
FEEDS="[$WETH_USD_FEED,$USDC_USD_FEED]"

cast send $ORACLE_ADDRESS \
  "setPriceFeeds(address[],address[])" \
  $TOKENS \
  $FEEDS \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

## 설정 확인

### 가격 피드 주소 확인

```bash
# WETH 피드 확인
cast call $ORACLE_ADDRESS "priceFeeds(address)" $WETH_ADDRESS --rpc-url $MONAD_RPC_URL

# USDC 피드 확인
cast call $ORACLE_ADDRESS "priceFeeds(address)" $USDC_ADDRESS --rpc-url $MONAD_RPC_URL
```

### 가격 조회 테스트

```bash
# WETH/USD 가격 조회
cast call $ORACLE_ADDRESS "getUsdPrice(address)" $WETH_ADDRESS --rpc-url $MONAD_RPC_URL

# USDC/USD 가격 조회
cast call $ORACLE_ADDRESS "getUsdPrice(address)" $USDC_ADDRESS --rpc-url $MONAD_RPC_URL

# 정규화된 가격 조회 (18 decimals)
cast call $ORACLE_ADDRESS "getUsdPriceNormalized(address)" $WETH_ADDRESS --rpc-url $MONAD_RPC_URL
```

### 피드 설정 여부 확인

```bash
cast call $ORACLE_ADDRESS "hasPriceFeed(address)" $WETH_ADDRESS --rpc-url $MONAD_RPC_URL
# true (0x01) 또는 false (0x00) 반환
```

## 필요한 정보 찾기

### Monad 테스트넷에서 확인해야 할 주소들

1. **WETH 토큰 주소**: Monad 테스트넷의 Wrapped ETH 컨트랙트 주소
2. **USDC 토큰 주소**: Monad 테스트넷의 USDC 컨트랙트 주소
3. **WETH/USD Chainlink Aggregator**: Monad 테스트넷의 Chainlink Data Feed 주소
4. **USDC/USD Chainlink Aggregator**: Monad 테스트넷의 Chainlink Data Feed 주소

이 정보는 다음에서 확인할 수 있습니다:
- Monad 공식 문서
- Monad 블록 익스플로러
- Chainlink 문서 (Monad 테스트넷 지원 여부 확인)

## 주의사항

1. **Owner만 설정 가능**: `setPriceFeed`는 owner만 호출할 수 있습니다
2. **유효한 Aggregator 주소**: address(0)는 설정할 수 없습니다
3. **Stale 체크**: 가격 피드가 1시간 이상 업데이트되지 않으면 `getUsdPrice`가 revert됩니다

## 문제 해결

### "NotOwner" 에러
- 배포한 주소와 현재 사용 중인 PRIVATE_KEY의 주소가 일치하는지 확인
- `cast call $ORACLE_ADDRESS "owner()"`로 owner 확인

### "PriceFeedNotSet" 에러
- 가격 피드가 설정되지 않았습니다
- 위의 설정 방법을 따라 가격 피드를 설정하세요

### "StalePrice" 에러
- Chainlink Aggregator의 가격이 1시간 이상 업데이트되지 않았습니다
- Aggregator 주소가 올바른지 확인하세요


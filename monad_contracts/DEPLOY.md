# Monad Testnet 배포 가이드

이 가이드는 `PriceOracleAdapter`와 `CCIPRouter`를 Monad 테스트넷에 배포하는 방법을 설명합니다.

## 사전 준비

1. **환경 변수 설정**
   - `.env` 파일을 생성하고 다음 변수들을 설정하세요:
   ```bash
   PRIVATE_KEY=your_private_key_here  # 0x 접두사 없이
   MONAD_RPC_URL=https://testnet-rpc.monad.xyz
   
   # CCIPRouter 배포용
   USDC_ADDRESS=0x...
   CCIP_ROUTER_ADDRESS=0x...
   DEST_CHAIN_SELECTOR=16015286601757825753  # Ethereum Sepolia
   DEST_RECEIVER_ADDRESS=0x...
   ```

2. **Monad 테스트넷 정보 확인**
   - RPC URL: `https://testnet-rpc.monad.xyz` (또는 공식 문서 확인)
   - Chain ID: 확인 필요
   - 가스 가격: 확인 필요

## 배포 방법

### 방법 1: PriceOracleAdapter만 배포

```bash
cd monad_contracts
forge script script/DeployPriceOracle.s.sol:DeployPriceOracle \
  --rpc-url $MONAD_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### 방법 2: CCIPRouter만 배포

```bash
cd monad_contracts
forge script script/DeployCCIPRouter.s.sol:DeployCCIPRouter \
  --rpc-url $MONAD_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### 방법 3: 모든 컨트랙트 배포 (통합 스크립트)

```bash
cd monad_contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $MONAD_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

## 배포 후 작업

### PriceOracleAdapter 설정

배포 후 가격 피드를 설정해야 합니다:

```bash
# WETH/USD 피드 설정
cast send $ORACLE_ADDRESS \
  "setPriceFeed(address,address)" \
  $WETH_ADDRESS \
  $WETH_USD_FEED_ADDRESS \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY

# USDC/USD 피드 설정
cast send $ORACLE_ADDRESS \
  "setPriceFeed(address,address)" \
  $USDC_ADDRESS \
  $USDC_USD_FEED_ADDRESS \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

### CCIPRouter에 USDC 입금

CCIPRouter가 USDC를 전송할 수 있도록 treasury에 USDC를 입금해야 합니다:

```bash
# USDC approve
cast send $USDC_ADDRESS \
  "approve(address,uint256)" \
  $ROUTER_ADDRESS \
  $(cast --to-uint256 1000000000000) \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY

# USDC deposit
cast send $ROUTER_ADDRESS \
  "depositUsdc(uint256)" \
  $(cast --to-uint256 1000000000) \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY
```

## 배포 확인

### PriceOracleAdapter 확인

```bash
# Owner 확인
cast call $ORACLE_ADDRESS "owner()" --rpc-url $MONAD_RPC_URL

# 가격 피드 확인
cast call $ORACLE_ADDRESS "priceFeeds(address)" $WETH_ADDRESS --rpc-url $MONAD_RPC_URL
```

### CCIPRouter 확인

```bash
# Owner 확인
cast call $ROUTER_ADDRESS "owner()" --rpc-url $MONAD_RPC_URL

# USDC 잔액 확인
cast call $ROUTER_ADDRESS "getUsdcBalance()" --rpc-url $MONAD_RPC_URL

# 설정 확인
cast call $ROUTER_ADDRESS "usdc()" --rpc-url $MONAD_RPC_URL
cast call $ROUTER_ADDRESS "ccipRouter()" --rpc-url $MONAD_RPC_URL
cast call $ROUTER_ADDRESS "destChainSelector()" --rpc-url $MONAD_RPC_URL
cast call $ROUTER_ADDRESS "destReceiver()" --rpc-url $MONAD_RPC_URL
```

## 테스트 전송

CCIPRouter를 통해 테스트 메시지를 전송:

```bash
# 수신자 배열과 금액 설정
RECIPIENTS="[0xRecipient1,0xRecipient2,0xRecipient3]"
AMOUNT_PER_RECIPIENT=$(cast --to-uint256 1000000)  # 1 USDC (6 decimals)

# sendMessage 호출
cast send $ROUTER_ADDRESS \
  "sendMessage(address[],uint256)" \
  $RECIPIENTS \
  $AMOUNT_PER_RECIPIENT \
  --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY \
  --value $(cast --to-uint256 1000000000000000)  # CCIP fee (예시)
```

## 주의사항

1. **개인키 보안**: `.env` 파일을 절대 커밋하지 마세요. `.gitignore`에 추가되어 있는지 확인하세요.

2. **가스비**: Monad 테스트넷의 가스 가격을 확인하고 충분한 native token을 보유하세요.

3. **CCIP 수수료**: `sendMessage` 호출 시 CCIP 수수료를 지불해야 합니다. `getFee()` 함수로 예상 수수료를 확인하세요.

4. **Receiver 배포**: 목적지 체인(Ethereum Sepolia)에 Receiver 컨트랙트가 먼저 배포되어 있어야 합니다.

## 문제 해결

### 배포 실패 시

1. RPC URL이 올바른지 확인
2. 개인키와 주소가 일치하는지 확인
3. 충분한 native token이 있는지 확인
4. 가스 한도가 충분한지 확인 (`--gas-limit` 옵션 사용)

### 트랜잭션 확인

```bash
# 트랜잭션 상태 확인
cast tx $TX_HASH --rpc-url $MONAD_RPC_URL

# 트랜잭션 영수증 확인
cast receipt $TX_HASH --rpc-url $MONAD_RPC_URL
```


# BattleMonads Contracts

Monad 블록체인 기반 예측 시장 배틀 게임 스마트 컨트랙트

## 프로젝트 구조

```
src/
├── PriceFeeds.sol          # Chainlink 가격 피드 연동
├── BattleMonads.sol        # 메인 배틀 게임 컨트랙트
├── MonsterTypes.sol        # 몬스터 타입 정의
├── MonsterStorage.sol      # 몬스터 데이터 구조
├── BattleStorage.sol       # 배틀 데이터 구조
├── interfaces/
│   └── AggregatorV3Interface.sol  # Chainlink 인터페이스
script/
├── GetPrices.s.sol         # 가격 조회 스크립트
├── DeployPriceFeeds.s.sol  # PriceFeeds 배포 스크립트
├── DeployBattleMoands.s.sol # BattleMonads 배포 스크립트
test/
├── PriceFeeds.t.sol        # 가격 피드 테스트
```

## 환경 설정

### 1. 의존성 설치

```bash
forge install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

## 주요 명령어

### 빌드

```bash
forge build
```

### 테스트

```bash
# 모든 테스트 실행
forge test

# Sepolia 포크로 테스트
forge test --fork-url $SEPOLIA_RPC_URL -vvv
```

### 가격 조회

실시간 BTC/ETH 가격 조회 (Sepolia 테스트넷):

```bash
source .env && forge script script/GetPrices.s.sol:GetPrices --fork-url $SEPOLIA_RPC_URL -vvv
```

### 배포

```bash
# Monad 테스트넷 - PriceFeeds 배포
forge script script/DeployPriceFeedsMonad.s.sol:DeployPriceFeedsMonad \
  --rpc-url monad \
  --private-key $PRIVATE_KEY \
  --broadcast

# Monad 테스트넷 - BattleMonads 배포
forge script script/DeployBattleMoands.s.sol:DeployBattleMonads \
  --rpc-url monad \
  --private-key $PRIVATE_KEY \
  --broadcast

# Sepolia 테스트넷 배포
forge script script/DeployPriceFeeds.s.sol:DeployPriceFeeds \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 컨트랙트 검증

```bash
# Monad 테스트넷 검증 (Sourcify)
forge verify-contract \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org' \
  <CONTRACT_ADDRESS> \
  src/PriceFeeds.sol:PriceFeeds

# Sepolia 테스트넷 검증
forge verify-contract <CONTRACT_ADDRESS> PriceFeeds \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 배포된 컨트랙트

### Monad 테스트넷
- **PriceFeeds Contract**: [`0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd`](https://testnet.monadscan.com/address/0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd#code)
- **BattleMonads Contract (v2)**: [`0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d`](https://testnet.monadscan.com/address/0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d#code)
- **BattleMonads Contract (v1)**: [`0x69366b194C707105186f2e889cAB84306c716E60`](https://testnet.monadscan.com/address/0x69366b194c707105186f2e889cab84306c716e60#code) *(Deprecated)*
- **배포 트랜잭션**: [MonadScan에서 확인](https://testnet.monadscan.com/address/0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d#code)

### Sepolia 테스트넷
- **PriceFeeds Contract**: [`0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd`](https://sepolia.etherscan.io/address/0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd#code)
- **배포 트랜잭션**: [Etherscan에서 확인](https://sepolia.etherscan.io/address/0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd#code)

## 게임 기능

### BattleMonads 컨트랙트 주요 기능
- **베팅 시스템**: 0.01 ~ 1 MON 범위에서 ETH/BTC 선택 베팅
- **댓글 & 공격**: 베팅한 사용자만 댓글 작성 가능, "attack" 포함 시 자동 공격
- **실시간 가격**: 몬스터 생성 시 Chainlink 가격 데이터로 birth price 설정
- **자동 정산**: 배틀 종료 시 승자 풀이 전체 베팅 금액 분배
- **배틀 시간**: 12시간 제한, HP 0 또는 시간 만료 시 자동 종료

### 게임 상수 (컨트랙트 설정)
```solidity
uint256 public constant MIN_BET = 0.01 ether;    // 최소 베팅 금액: 0.01 MON
uint256 public constant MAX_BET = 1 ether;       // 최대 베팅 금액: 1 MON
uint256 public constant BATTLE_DURATION = 12 hours; // 배틀 지속 시간: 12시간
uint256 public constant DEFAULT_HP = 100;        // 몬스터 기본 HP: 100
```

### 게임 플로우
1. **배틀 생성**: 관리자가 ETH vs BTC 몬스터 배틀 생성 (자동으로 첫 배틀 ID: 1 생성)
2. **베팅**: 사용자가 원하는 몬스터에 베팅 (0.01-1 MON)
3. **댓글/공격**: 베팅한 사용자만 댓글 작성, "attack" 포함 시 반대편 공격 (-1 HP)
4. **배틀 종료**: HP 0 또는 12시간 경과 시 자동 종료
5. **정산**: 승자 풀이 베팅 비율에 따라 보상 분배

### 컨트랙트 버전 히스토리
- **v1** (`0x6936...60`): 1시간 배틀 기간 - *Deprecated*
- **v2** (`0x79d6...3d`): 12시간 배틀 기간 - **현재 사용**

## Chainlink Data Feeds

### Monad 테스트넷
| Feed | Address | Decimals |
|------|---------|----------|
| BTC/USD | 0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31 | 8 |
| ETH/USD | 0x0c76859E85727683Eeba0C70Bc2e0F5781337818 | 8 |

### Sepolia 테스트넷

| Feed | Address | Decimals |
|------|---------|----------|
| BTC/USD | 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43 | 8 |
| ETH/USD | 0x694AA1769357215DE4FAC081bf1f309aDC325306 | 8 |

## 개발 도구

### Forge 명령어

```bash
# 컨트랙트 크기 확인
forge build --sizes

# 가스 스냅샷
forge snapshot

# 코드 포맷팅
forge fmt
```

### Cast 명령어

```bash
# 컨트랙트 함수 호출
cast call <CONTRACT_ADDRESS> "getBTCPrice()" --rpc-url $SEPOLIA_RPC_URL

# 트랜잭션 전송
cast send <CONTRACT_ADDRESS> "functionName()" --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY
```

### Anvil (로컬 테스트넷)

```bash
# 로컬 테스트넷 실행
anvil

# 포크 모드로 실행
anvil --fork-url $SEPOLIA_RPC_URL
```

## 주요 함수 사용법

### BattleMonads 컨트랙트

```solidity
// 배틀에 베팅 (0.01-1 MON)
function bet(uint256 battleId, MonsterType side) external payable

// 댓글 작성 (베팅한 사용자만 가능)
function addComment(uint256 battleId, string memory content) external

// 배틀 정보 조회
function getBattle(uint256 battleId) external view returns (Battle memory)

// 몬스터 정보 조회
function getMonster(uint256 monsterId) external view returns (Monster memory)

// 사용자 베팅 정보 조회
function getUserBet(uint256 battleId, address user) external view returns (uint256 ethBet, uint256 btcBet)

// 사용자 댓글 권한 확인
function canUserComment(uint256 battleId, address user) external view returns (bool)
```

### Cast 명령어 예시

```bash
# 현재 배틀 정보 조회
cast call 0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d "getBattle(uint256)" 1 --rpc-url https://testnet-rpc.monad.xyz

# ETH 몬스터에 0.1 MON 베팅
cast send 0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d "bet(uint256,uint8)" 1 0 --value 0.1ether --private-key $PRIVATE_KEY --rpc-url https://testnet-rpc.monad.xyz

# 댓글 작성 (공격 포함)
cast send 0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d "addComment(uint256,string)" 1 "attack the enemy monster!" --private-key $PRIVATE_KEY --rpc-url https://testnet-rpc.monad.xyz
```

## 프론트엔드 연동

현재 BattleMonads 게임은 Next.js 기반 웹 앱과 연동되어 있습니다:

- **저장소**: `/battlemonads_fe/`
- **주요 기술**: Next.js 15, Wagmi v2, Supabase, Discord OAuth
- **실시간 기능**: 가격 업데이트, 남은 시간 표시, 댓글 시스템

### 주요 컴포넌트
- `BattleArena`: 실시간 배틀 현황 및 12시간 타이머
- `BettingPanel`: 베팅 인터페이스
- `CommentSection`: Discord 프로필 연동 댓글 시스템
- `PriceTicker`: Chainlink 가격 데이터 표시

## 트러블슈팅

### 일반적인 문제

1. **베팅 실패 (insufficient balance)**
   - 지갑에 최소 0.01 MON + 가스비 확인

2. **댓글 작성 불가**
   - 해당 배틀에 베팅했는지 확인
   - Discord 로그인 및 지갑 연결 확인

3. **트랜잭션 실패 (higher priority)**
   - 가스비를 높여서 재시도: `--gas-price 200000000000`

### 네트워크 이슈
```bash
# Monad 테스트넷 연결 확인
cast block-number --rpc-url https://testnet-rpc.monad.xyz

# 지갑 잔액 확인
cast balance YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz
```

## 문서

- [Foundry 문서](https://book.getfoundry.sh/)
- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [Monad 문서](https://docs.monad.xyz/)
- [BattleMonads 게임 플레이](https://battlemonads.vercel.app/)
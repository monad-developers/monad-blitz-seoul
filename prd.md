# 크립토 배틀 - 실시간 가격 기반 몬스터 대전 게임

## 프로젝트 개요

**아이디어**: ETH와 BTC 가격 변동을 실시간으로 반영하는 몬스터 배틀 게임. 몬스터는 생성 시점의 가격을 기록하고, 이후 가격 변동에 따라 체력이 회복되며, 유저들의 베팅과 공격으로 배틀이 진행됨.

**목표**: Chainlink Data Feeds를 활용해 실시간 가격 데이터를 게임에 통합하고, Data Streams를 통해 날씨 데이터를 체력 회복에 반영하는 단순하면서도 역동적인 배틀 시스템 구현.
    
## 핵심 게임 메커니즘

### 1. 몬스터 시스템

**몬스터 타입**:
- **ETH 몬스터**: 이더리움 가격과 연동
- **BTC 몬스터**: 비트코인 가격과 연동

**몬스터 속성**:
```solidity
struct Monster {
    uint256 id;
    MonsterType monsterType; // ETH or BTC
    uint256 birthPrice;      // 생성 시점 가격 (USD)
    uint256 currentHP;       // 현재 체력
    uint256 maxHP;          // 최대 체력 (1000)
    uint256 lastUpdateTime;  // 마지막 업데이트 시간
    address owner;           // 몬스터 소유자
}
```

### 2. 가격 기반 체력 회복 시스템

**5분마다 자동 체력 회복**:
- Chainlink Data Feeds를 통해 현재 가격 조회
- 생성 시점 가격 대비 변동률 계산
- 변동률에 따른 체력 회복/감소

**회복 알고리즘**:
```solidity
function calculateHPRecovery(Monster memory monster) public view returns (int256) {
    uint256 currentPrice = getCurrentPrice(monster.monsterType);
    int256 priceChange = int256(currentPrice) - int256(monster.birthPrice);
    int256 changePercent = (priceChange * 100) / int256(monster.birthPrice);
    
    // 가격 변동률에 따른 HP 회복량
    // +1% = +10 HP, -1% = -5 HP (하락 시 더 적은 피해)
    if (changePercent > 0) {
        return changePercent * 10; // 상승 시 10HP per 1%
    } else {
        return changePercent * 5;  // 하락 시 5HP per 1%
    }
}
```

### 3. 날씨 기반 실시간 회복 보정

**Data Streams를 통한 날씨 데이터**:
- 실시간 날씨 정보 수집 (온도, 날씨 상태)
- 날씨에 따른 추가 회복 보너스

**날씨 보정 효과**:
```solidity
enum Weather { SUNNY, RAINY, CLOUDY, SNOWY }

function getWeatherBonus(Weather weather, MonsterType monsterType) returns (int256) {
    if (weather == Weather.SUNNY) {
        // 맑은 날: 모든 몬스터 +5 HP/분
        return 5;
    } else if (weather == Weather.RAINY) {
        // 비오는 날: ETH 몬스터 +10 HP/분, BTC 몬스터 +3 HP/분
        return monsterType == MonsterType.ETH ? 10 : 3;
    } else if (weather == Weather.SNOWY) {
        // 눈오는 날: BTC 몬스터 +10 HP/분, ETH 몬스터 +3 HP/분
        return monsterType == MonsterType.BTC ? 10 : 3;
    }
    return 0; // 흐린 날: 보너스 없음
}
```

### 4. 베팅 & 공격 시스템

**배틀 매칭**:
- 시스템이 자동으로 ETH 몬스터 vs BTC 몬스터 매칭
- 배틀이 시작되면 양쪽에 베팅 풀 생성

**베팅 메커니즘**:
```solidity
struct Battle {
    uint256 battleId;
    uint256 ethMonsterId;
    uint256 btcMonsterId;
    uint256 ethBettingPool;  // ETH 몬스터 지지 베팅
    uint256 btcBettingPool;  // BTC 몬스터 지지 베팅
    mapping(address => uint256) ethBets;
    mapping(address => uint256) btcBets;
    bool isActive;
}
```

**공격 시스템**:
- 베팅한 유저만 "attack" 댓글로 공격 가능
- 베팅 금액에 비례한 데미지 계산

```solidity
function attack(uint256 battleId, string memory comment, MonsterType targetType) public {
    require(keccak256(bytes(comment)) == keccak256(bytes("attack")), "Invalid command");
    
    Battle storage battle = battles[battleId];
    uint256 userBet = targetType == MonsterType.ETH ? 
                      battle.btcBets[msg.sender] : 
                      battle.ethBets[msg.sender];
    
    require(userBet > 0, "Must bet to attack");
    
    // 베팅 금액의 1%만큼 데미지 (최대 50)
    uint256 damage = min(userBet / 100, 50);
    
    // 타겟 몬스터에 데미지 적용
    if (targetType == MonsterType.ETH) {
        monsters[battle.ethMonsterId].currentHP -= damage;
    } else {
        monsters[battle.btcMonsterId].currentHP -= damage;
    }
}
```

### 5. 배틀 종료 & 보상

**승리 조건**:
- 상대 몬스터 HP가 0이 되면 승리
- 시간 제한 (24시간) 후 HP가 더 높은 몬스터 승리

**보상 분배**:
```solidity
function endBattle(uint256 battleId) public {
    Battle storage battle = battles[battleId];
    Monster memory ethMonster = monsters[battle.ethMonsterId];
    Monster memory btcMonster = monsters[battle.btcMonsterId];
    
    bool ethWins = ethMonster.currentHP > btcMonster.currentHP;
    uint256 totalPool = battle.ethBettingPool + battle.btcBettingPool;
    
    // 승리 팀 베터들에게 비례 분배
    if (ethWins) {
        distributeRewards(battle.ethBets, totalPool, battle.ethBettingPool);
    } else {
        distributeRewards(battle.btcBets, totalPool, battle.btcBettingPool);
    }
}
```

## 기술 구현

### 스마트 컨트랙트 구조

1. **MonsterContract.sol**: 몬스터 생성 및 관리
2. **BattleContract.sol**: 배틀 매칭 및 베팅 관리
3. **PriceOracle.sol**: Chainlink Data Feeds 통합
4. **WeatherOracle.sol**: Chainlink Data Streams 통합
5. **RewardContract.sol**: 보상 분배 로직

### Chainlink 통합

**Price Feeds 사용**:
```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceOracle {
    AggregatorV3Interface internal ethPriceFeed;
    AggregatorV3Interface internal btcPriceFeed;
    
    constructor() {
        // Monad testnet addresses (예시)
        ethPriceFeed = AggregatorV3Interface(0x...);
        btcPriceFeed = AggregatorV3Interface(0x...);
    }
    
    function getETHPrice() public view returns (uint256) {
        (, int256 price,,,) = ethPriceFeed.latestRoundData();
        return uint256(price);
    }
}
```

**Data Streams 사용**:
```solidity
contract WeatherOracle {
    IDataStreamsVerifier public dataStreamsVerifier;
    
    function updateWeather(bytes calldata report) external {
        // Data Streams 리포트 검증
        (bytes32[] memory feedIds, bytes[] memory values, uint256 timestamp) = 
            dataStreamsVerifier.verifyReport(report);
        
        // 날씨 데이터 파싱 및 저장
        currentWeather = parseWeatherData(values[0]);
        lastWeatherUpdate = timestamp;
    }
}
```

### 자동화 시스템

**Chainlink Automation 활용**:
```solidity
contract HPRecoveryAutomation is AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata) external view override 
        returns (bool upkeepNeeded, bytes memory) {
        // 5분마다 체력 회복 체크
        upkeepNeeded = (block.timestamp - lastRecoveryTime) > 300;
    }
    
    function performUpkeep(bytes calldata) external override {
        // 모든 활성 몬스터 체력 회복
        recoverAllMonstersHP();
        lastRecoveryTime = block.timestamp;
    }
}
```

## 게임 플로우 예시

### 1단계: 몬스터 생성
```
1. Alice가 ETH 몬스터 생성 (현재 ETH 가격: $2,500)
2. Bob이 BTC 몬스터 생성 (현재 BTC 가격: $65,000)
3. 두 몬스터 모두 1000 HP로 시작
```

### 2단계: 자동 매칭 & 배틀 시작
```
시스템이 Alice의 ETH 몬스터와 Bob의 BTC 몬스터를 매칭
배틀 #1 생성 - 베팅 풀 오픈
```

### 3단계: 커뮤니티 베팅
```
- Charlie: ETH 몬스터에 100 MON 베팅
- David: BTC 몬스터에 150 MON 베팅
- Eve: ETH 몬스터에 200 MON 베팅
```

### 4단계: 실시간 체력 변동
```
5분 후:
- ETH 가격: $2,550 (+2%) → ETH 몬스터 +20 HP
- BTC 가격: $64,500 (-0.77%) → BTC 몬스터 -3.85 HP
- 날씨: 비 → ETH 몬스터 추가 +10 HP, BTC 몬스터 +3 HP

현재 HP:
- ETH 몬스터: 1030 HP
- BTC 몬스터: 999 HP
```

### 5단계: 유저 공격
```
David: "attack" 댓글로 ETH 몬스터 공격 → -50 damage
Charlie: "attack" 댓글로 BTC 몬스터 공격 → -50 damage

현재 HP:
- ETH 몬스터: 980 HP
- BTC 몬스터: 949 HP
```

### 6단계: 배틀 종료 & 보상
```
24시간 후 최종 HP:
- ETH 몬스터: 1,120 HP (승리)
- BTC 몬스터: 890 HP

총 베팅 풀: 450 MON
ETH 지지자들에게 비례 분배:
- Charlie: 150 MON (원금 100 + 이익 50)
- Eve: 300 MON (원금 200 + 이익 100)
```

## 핵심 특징

1. **단순한 규칙**: ETH vs BTC, 가격 상승 = HP 회복
2. **실시간 데이터**: 5분마다 Chainlink를 통한 가격/날씨 업데이트
3. **커뮤니티 참여**: 베팅과 공격으로 배틀 영향력 행사
4. **투명성**: 모든 가격 데이터와 날씨 정보 온체인 검증
5. **자동화**: Chainlink Automation으로 체력 회복 자동 처리

## 기술 스택

- **블록체인**: Monad (EVM 호환)
- **가격 오라클**: Chainlink Data Feeds (ETH/USD, BTC/USD)
- **날씨 데이터**: Chainlink Data Streams
- **자동화**: Chainlink Automation
- **스마트 컨트랙트**: Solidity
- **토큰**: MON (게임 토큰)
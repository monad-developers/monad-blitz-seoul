# 🚀 Monaminer 컨트랙트 배포 가이드

## 📋 배포 순서

배포 스크립트는 다음 순서로 실행됩니다:

1. **MMToken** - ERC20 보상 토큰
2. **MinerNFT** - 채굴기 NFT 컨트랙트
3. **GameManager** - 게임 라운드 관리
4. **RewardManager** - 보상 분배 관리
5. **MiningEngine** - 채굴 로직 실행
6. **Setup** - 컨트랙트 권한 설정 및 초기화

## 🔧 배포 명령어

### 로컬 네트워크 배포

```bash
# 로컬 블록체인 시작
yarn chain

# 컨트랙트 배포
yarn deploy
```

### Monad 테스트넷 배포

```bash
# 테스트넷에 배포
yarn deploy --network monadTestnet
```

### 특정 스크립트만 실행

```bash
# 특정 태그만 배포
yarn deploy --tags MMToken
yarn deploy --tags MinerNFT
yarn deploy --tags GameManager
yarn deploy --tags RewardManager
yarn deploy --tags MiningEngine
yarn deploy --tags Setup
```

## 📁 배포 스크립트 상세

### 1. MMToken (00_deploy_mm_token.ts)

- **기능**: ERC20 보상 토큰 배포
- **초기 공급량**: 21,000,000 MM
- **소유자**: 배포자
- **의존성**: 없음

### 2. MinerNFT (02_deploy_miner_nft.ts)

- **기능**: 5가지 타입의 채굴기 NFT
- **NFT 타입**: EvenBlaster, PrimeSniper, BalancedScan, PiSniper, SquareSeeker
- **의존성**: 없음

### 3. GameManager (01_deploy_game_manager.ts)

- **기능**: 게임 라운드 관리, 패턴 생성
- **생성자 파라미터**: MinerNFT 주소
- **의존성**: MinerNFT

### 4. RewardManager (03_deploy_reward_manager.ts)

- **기능**: 보상 분배 및 수수료 관리
- **생성자 파라미터**: MMToken 주소, 개발팀 지갑 주소
- **의존성**: MMToken

### 5. MiningEngine (05_deploy_mining_engine.ts)

- **기능**: 채굴 로직 실행
- **생성자 파라미터**: GameManager, MinerNFT, RewardManager 주소
- **의존성**: GameManager, MinerNFT, RewardManager

### 6. Setup (99_setup_contracts.ts)

- **기능**: 컨트랙트 간 권한 설정 및 초기화
- **실행 작업**:
  - MiningEngine → RewardManager 권한 부여
  - GameManager → MinerNFT 민팅 권한 부여
  - RewardManager에 10,000 MM 토큰 충전
  - GameManager 초기화 (최초 NFT 3개 민팅)
- **의존성**: 모든 컨트랙트

## 🎯 배포 후 확인사항

### 1. 컨트랙트 주소 확인

```bash
# 배포된 주소 확인
ls deployments/localhost/  # 로컬
ls deployments/monadTestnet/  # 테스트넷
```

### 2. 기능 테스트

```bash
# 디버그 페이지 접속
http://localhost:3000/debug

# 확인할 기능들:
# - GameManager.getCurrentRound() - 현재 라운드 정보
# - MinerNFT.balanceOf(owner) - 초기 NFT 3개 확인
# - RewardManager.getContractBalance() - 보상 잔액 확인
# - MiningEngine.attemptMining(nftId) - 채굴 시도
```

## 🔑 주요 함수

### GameManager

- `getCurrentRound()`: 현재 라운드 정보 조회
- `isRoundActive()`: 라운드 활성 상태 확인
- `initializeWithNFTs()`: 최초 NFT 민팅 (Setup에서 실행)

### MinerNFT

- `getOwnedMiners(address)`: 소유한 NFT 목록 조회
- `getMinerStats(tokenId)`: NFT 능력치 확인
- `setMinter(address, bool)`: 민팅 권한 설정

### MiningEngine

- `attemptMining(nftId)`: 채굴 시도 (메인 함수)
- `getPlayerStats(address)`: 플레이어 통계 조회
- `getMiningHistory(address, limit)`: 채굴 기록 조회

### RewardManager

- `getContractBalance()`: 보상 잔액 확인
- `getPlayerStats(address)`: 플레이어 보상 통계

## 🚨 주의사항

1. **배포 순서**: 의존성 때문에 반드시 순서대로 배포해야 함
2. **가스 한도**: GameManager 배포 시 가스 한도 15,000,000 설정
3. **권한 설정**: Setup 스크립트 실행 필수
4. **토큰 충전**: RewardManager에 충분한 MM 토큰 충전 필요

## 📊 배포 후 게임 상태

### 초기 상태

- **라운드**: 1라운드 시작
- **패턴**: 랜덤 패턴 (EVEN/ODD/PRIME/PI/SQUARE 중 하나)
- **범위**: 30,000 ~ 80,000 사이 랜덤 범위
- **NFT**: 배포자가 BalancedScan 3개 소유
- **보상 잔액**: 10,000 MM 토큰

### 게임 시작 준비 완료

- ✅ 모든 컨트랙트 배포 완료
- ✅ 권한 설정 완료
- ✅ 보상 토큰 충전 완료
- ✅ 초기 NFT 민팅 완료
- ✅ 첫 라운드 시작

플레이어는 이제 `attemptMining(nftId)` 함수를 사용하여 채굴을 시작할 수 있습니다!

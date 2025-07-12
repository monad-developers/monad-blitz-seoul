# ⚡ 빠른 배포 명령어 참조

## 🚀 한 번에 배포하기

### 로컬 개발 환경

```bash
# 1. 로컬 블록체인 시작
yarn chain

# 2. 새 터미널에서 모든 컨트랙트 배포
yarn deploy

# 3. 프론트엔드 시작
yarn start
```

### Monad 테스트넷

```bash
# 테스트넷에 배포
yarn deploy --network monadTestnet
```

## 🔧 단계별 배포하기

```bash
# 1. MMToken 배포
yarn deploy --tags MMToken

# 2. MinerNFT 배포
yarn deploy --tags MinerNFT

# 3. GameManager 배포
yarn deploy --tags GameManager

# 4. RewardManager 배포
yarn deploy --tags RewardManager

# 5. MiningEngine 배포
yarn deploy --tags MiningEngine

# 6. 컨트랙트 설정 및 초기화
yarn deploy --tags Setup
```

## 🚨 문제 해결

### 배포 실패 시

```bash
# 배포 상태 초기화
rm -rf deployments/localhost/

# 다시 배포
yarn deploy
```

### 특정 컨트랙트만 다시 배포

```bash
# 예: MiningEngine만 다시 배포
yarn deploy --tags MiningEngine --reset
```

## 📍 배포 후 확인

### 1. 컨트랙트 주소 확인

```bash
# 배포된 주소들 확인
cat deployments/localhost/GameManager.json | jq '.address'
cat deployments/localhost/MinerNFT.json | jq '.address'
cat deployments/localhost/RewardManager.json | jq '.address'
cat deployments/localhost/MiningEngine.json | jq '.address'
cat deployments/localhost/MMToken.json | jq '.address'
```

### 2. 웹 인터페이스 확인

```bash
# 로컬 프론트엔드 시작
yarn start

# 브라우저에서 확인
# http://localhost:3000/debug
```

## 🎯 테스트 시나리오

### 1. 기본 기능 테스트

```javascript
// 디버그 페이지에서 실행
// 1. 현재 라운드 확인
GameManager.getCurrentRound();

// 2. 소유한 NFT 확인
MinerNFT.getOwnedMiners(YOUR_ADDRESS);

// 3. 채굴 시도
MiningEngine.attemptMining(1); // NFT ID 1 사용

// 4. 보상 잔액 확인
RewardManager.getContractBalance();
```

### 2. 연속 채굴 테스트

```javascript
// 여러 번 채굴 시도
for (let i = 0; i < 10; i++) {
  await MiningEngine.attemptMining(1);
}
```

## 📊 예상 배포 시간

- **로컬**: 약 30초
- **테스트넷**: 약 2-3분
- **메인넷**: 약 5-10분 (가스비에 따라 다름)

## 🔑 주요 주소 (배포 후 업데이트)

```bash
# 로컬 배포 주소들 (예시)
GameManager: 0x...
MinerNFT: 0x...
RewardManager: 0x...
MiningEngine: 0x...
MMToken: 0x...
```

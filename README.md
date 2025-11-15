# Monad Blitz - 자동 매칭 캐릭터 배틀 AI 게임

MONstar는 사용자가 프롬프트 작성을 통해 자신의 캐릭터를 설정하고 해당 캐릭터를 Battle Pool(콜로세움)에 넣고 다른 무작위 플레이어와 싸우게 하고, 결과에 따라 해당 Battle Pool에 맞는 배당을 얻고 잃게 되는 AI 자동 전투 게임이다.

## 게임 규칙

### 캐릭터 생성

- 사용자는 캐릭터 이름과 캐릭터 프롬프트를 입력한다.
- 작성한 값이 맞는지 확인 후 캐릭터 NFT 민팅한다.

### 캐릭터 Vault

- 사용자는 캐릭터 NFT에 할당된 볼트에 원하는 액수만큼 예치한다.

### 콜로세움 입장

- 사용자는 원하는 판돈을 설정하고 그 판돈에 맞는 콜로세움에 입장한다.

### 전투 시작

- 사용자의 캐릭터 NFT는 설정한 판돈을 걸고 콜로세움에 있는 무작위 캐릭터 NFT와 전투를 진행한다.
- 승부에서 승리하면 해당 판돈 만큼 얻으며, 패배한다면 판돈 만큼 잃는다.
- 해당 승부는 스케쥴러의 시간에 따라 반복된다.

### 전투 후

- 만약 볼트의 잔고가 소진되면 자동으로 콜로세움에서 퇴출된다.
- 볼트의 잔약은 남아있고 만약 콜로세움에서 나오고 싶다면 퇴장 버튼을 눌러 퇴장가능하다.

###

## 📋 USER scenario

1. 사용자는 자신의 프롬프트와 이미지를 통해 캐릭터 NFT를 생성한다.
2. 사용자는 자신의 캐릭터 NFT를 자신이 원하는 배당을 주는 Battle Pool(콜로세움)에 넣는다. (온체인)
3. Battle Pool 에서는 무작위로 상대방 캐릭터와 매칭이 진행된다. (온체인)
4. 사용자의 캐릭터와 무작위 플레이어의 캐릭터가 매칭이 된다면 정해진 AI 배틀 룰에 따라 승패를 가른다. (오프체인)
5. 해당 승패에 따라 승리 플레이어는 콜로세움 배당에 맞는 모나드 코인을 벌게 되며, 패배 플레이어는 배당에 맞는 모나드 코인을 잃게 된다. (온체인)
6. 해당 배틀 결과는 온체인에 저장된다.

## 🏗️ 아키텍처

```
스마트 컨트랙트
contracts/
├── MONCharacter.sol
├── MONCharacterVault.sol
└── MONColosseum.sol
```

MONCharacter.sol

- 캐릭터 민팅

MONCharacterVault.sol

- 볼트에 입출금 및 정산

MONColosseum.sol

- 콜로세움 판돈설정
- 라운드 시작
- 결과 온체인 기록

## 🔧 기술 스택

네트워크: Monad Testnet
RPC URL: https://testnet-rpc.monad.xyz
Chain ID: 10143 (0x279F)
Explorer: https://testnet.monadexplorer.com/
wallet solution: privy
fullstack : nextJs, typescript
CSS: tailwind

## 📋 컨트랙트 인터페이스

### MONCharacter 주요 함수

```solidity
// 캐릭터 NFT 민트
function mint(string calldata metadataURI) external returns (uint256 tokenId)

// 캐릭터 NFT ID 조회
 function tokenIdOf(address owner) external view returns (uint256)
```

### MONCharacterVault 주요 함수

```solidity
// 캐릭터 NFT Vault에 입금
function deposit() external payable

// 캐릭터 NFT Vault에서 출금
function withdraw(uint256 amount) external nonReentrant

// 캐릭터 배틀 후 정산
function settle(uint256 winnerNftId,uint256 loserNftId,uint256 amount) external onlyColosseum returns (uint256)
```

### MONColosseum 주요 함수

```solidity
// 콜로세움 생성 (판돈 설정)
function createNewColosseum(uint256 buyIn) external onlyGameMaster

// 콜로세움 압장
function enterColosseum(uint256 nftId, uint256 colosseumId) external

// 콜로세움 퇴장
function exitColosseum(uint256 nftId, uint256 colosseumId) external

// 라운드 시작
function triggerRound(uint256 colosseumId) external onlyGameMaster

// 캐릭터 배틀 후 정산
function submitBattleResults(uint256 colosseumId,uint256 roundId,
uint256[] calldata winners,uint256[] calldata losers) external onlyGameMaster nonReentrant
```

📊 Future Task

- 체인링크 VRF, Function, Automation 지원시 적용
- 가스비 최적화
- 컨트랙트 보안 오딧

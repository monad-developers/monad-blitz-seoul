export const BATTLE_MONADS_ABI = [
  {
    "type": "constructor",
    "inputs": [{"name": "_priceFeeds", "type": "address", "internalType": "address"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "BATTLE_DURATION",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DEFAULT_HP",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_BET",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MAX_BET",
    "inputs": [],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "createBattle",
    "inputs": [],
    "outputs": [{"name": "battleId", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "bet",
    "inputs": [
      {"name": "battleId", "type": "uint256", "internalType": "uint256"},
      {"name": "side", "type": "uint8", "internalType": "enum BattleMonads.MonsterType"}
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "addComment",
    "inputs": [
      {"name": "battleId", "type": "uint256", "internalType": "uint256"},
      {"name": "content", "type": "string", "internalType": "string"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "endBattle",
    "inputs": [{"name": "battleId", "type": "uint256", "internalType": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimReward",
    "inputs": [{"name": "battleId", "type": "uint256", "internalType": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getBattle",
    "inputs": [{"name": "battleId", "type": "uint256", "internalType": "uint256"}],
    "outputs": [
      {"name": "id", "type": "uint256", "internalType": "uint256"},
      {"name": "ethMonsterId", "type": "uint256", "internalType": "uint256"},
      {"name": "btcMonsterId", "type": "uint256", "internalType": "uint256"},
      {"name": "startTime", "type": "uint256", "internalType": "uint256"},
      {"name": "endTime", "type": "uint256", "internalType": "uint256"},
      {"name": "isActive", "type": "bool", "internalType": "bool"},
      {"name": "isSettled", "type": "bool", "internalType": "bool"},
      {"name": "winner", "type": "uint8", "internalType": "enum BattleMonads.MonsterType"},
      {"name": "ethPool", "type": "uint256", "internalType": "uint256"},
      {"name": "btcPool", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "monsters",
    "inputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "outputs": [
      {"name": "id", "type": "uint256", "internalType": "uint256"},
      {"name": "monsterType", "type": "uint8", "internalType": "enum BattleMonads.MonsterType"},
      {"name": "birthPrice", "type": "uint256", "internalType": "uint256"},
      {"name": "currentHP", "type": "uint256", "internalType": "uint256"},
      {"name": "maxHP", "type": "uint256", "internalType": "uint256"},
      {"name": "createTime", "type": "uint256", "internalType": "uint256"},
      {"name": "exists", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserBets",
    "inputs": [
      {"name": "battleId", "type": "uint256", "internalType": "uint256"},
      {"name": "user", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "ethBet", "type": "uint256", "internalType": "uint256"},
      {"name": "btcBet", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBattleComments",
    "inputs": [{"name": "battleId", "type": "uint256", "internalType": "uint256"}],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct BattleMonads.Comment[]",
        "components": [
          {"name": "id", "type": "uint256", "internalType": "uint256"},
          {"name": "battleId", "type": "uint256", "internalType": "uint256"},
          {"name": "user", "type": "address", "internalType": "address"},
          {"name": "content", "type": "string", "internalType": "string"},
          {"name": "timestamp", "type": "uint256", "internalType": "uint256"},
          {"name": "isAttack", "type": "bool", "internalType": "bool"},
          {"name": "attackTarget", "type": "uint8", "internalType": "enum BattleMonads.MonsterType"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canUserComment",
    "inputs": [
      {"name": "battleId", "type": "uint256", "internalType": "uint256"},
      {"name": "user", "type": "address", "internalType": "address"}
    ],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "BattleCreated",
    "inputs": [
      {"name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "ethMonsterId", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "btcMonsterId", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "ethBirthPrice", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "btcBirthPrice", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BetPlaced",
    "inputs": [
      {"name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "user", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "side", "type": "uint8", "indexed": false, "internalType": "enum BattleMonads.MonsterType"},
      {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CommentAdded",
    "inputs": [
      {"name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "user", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "content", "type": "string", "indexed": false, "internalType": "string"},
      {"name": "isAttack", "type": "bool", "indexed": false, "internalType": "bool"},
      {"name": "attackTarget", "type": "uint8", "indexed": false, "internalType": "enum BattleMonads.MonsterType"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "MonsterAttacked",
    "inputs": [
      {"name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "target", "type": "uint8", "indexed": false, "internalType": "enum BattleMonads.MonsterType"},
      {"name": "damage", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "newHP", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "BattleEnded",
    "inputs": [
      {"name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "winner", "type": "uint8", "indexed": false, "internalType": "enum BattleMonads.MonsterType"},
      {"name": "ethFinalHP", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "btcFinalHP", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardClaimed",
    "inputs": [
      {"name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "user", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
] as const;

// Monad 테스트넷에 배포된 BattleMonads 컨트랙트 주소
export const BATTLE_MONADS_ADDRESS = '0x79d6c0F8f1c92F98C4Ef3B76F0229406c8C3A63d';

// MonsterType enum
export enum MonsterType {
  ETH = 0,
  BTC = 1
}
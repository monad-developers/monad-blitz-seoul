// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MonsterTypes.sol";
import "./MonsterStorage.sol";
import "./BattleStorage.sol";

contract MonsterBattle {
    uint256 public constant DEFAULT_MAX_HP = 100;

    uint256 public nextMonsterId = 1;
    uint256 public nextBattleId = 1;

    mapping(uint256 => Monster) public monsters;
    mapping(uint256 => Battle) private battles;
    mapping(uint256 => mapping(address => uint256)) public usedAttacksAgainstETH;
    mapping(uint256 => mapping(address => uint256)) public usedAttacksAgainstBTC;

    address public admin;

    event BattleCreated(uint256 indexed battleId, uint256 ethMonsterId, uint256 btcMonsterId);
    event BetPlaced(uint256 indexed battleId, address indexed user, MonsterType side, uint256 amount); // 원하는 몬스터에 배팅
    event Attacked(uint256 indexed battleId, address indexed user, MonsterType target, uint256 damage, uint256 newHP); // 몬스터 공격
    event BattleEnded(uint256 indexed battleId, MonsterType winner);
    event RewardClaimed(uint256 indexed battleId, address indexed user, uint256 amount);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyActiveBattle(uint256 battleId) { // 배틀 활성화 여부 
        require(battles[battleId].isActive, "battle not active");
        _;
    }

    /// @notice 배틀 생성 (ETH vs BTC 몬스터 자동 생성)
    function createBattle(uint256 initialHP) external returns (uint256 battleId) {
        if (initialHP == 0) initialHP = DEFAULT_MAX_HP; // 초기 HP = 100

        uint256 ethMonsterId = nextMonsterId++;
        monsters[ethMonsterId] = Monster({ // 이더 몬스터 생성
            id: ethMonsterId,
            monsterType: MonsterType.ETH,
            birthPrice: 0,
            currentHP: initialHP,
            maxHP: initialHP,
            lastUpdateTime: block.timestamp,
            owner: msg.sender,
            exists: true
        });

        uint256 btcMonsterId = nextMonsterId++; // 비트 몬스터 생성
        monsters[btcMonsterId] = Monster({
            id: btcMonsterId,
            monsterType: MonsterType.BTC,
            birthPrice: 0,
            currentHP: initialHP,
            maxHP: initialHP,
            lastUpdateTime: block.timestamp,
            owner: msg.sender,
            exists: true
        });

        battleId = nextBattleId++;
        Battle storage bt = battles[battleId]; // 배틀 정보 저장
        bt.battleId = battleId;
        bt.ethMonsterId = ethMonsterId;
        bt.btcMonsterId = btcMonsterId;
        bt.startTime = block.timestamp;
        bt.endTime = block.timestamp + 1 days;
        bt.isActive = true;

        emit BattleCreated(battleId, ethMonsterId, btcMonsterId);
    }

    /// @notice 몬스터에 베팅 (내가 건 쪽은 공격 X, 반대편 공격 가능)
    function bet(uint256 battleId, MonsterType side) external payable onlyActiveBattle(battleId) {
        require(msg.value > 0, "bet must be > 0");

        Battle storage bt = battles[battleId];
        if (side == MonsterType.ETH) {
            bt.ethBets[msg.sender] += msg.value;
            bt.ethBettingPool += msg.value;
        } else {
            bt.btcBets[msg.sender] += msg.value;
            bt.btcBettingPool += msg.value;
        }

        emit BetPlaced(battleId, msg.sender, side, msg.value);
    }

    modifier onlyBeforeEnd(uint256 battleId) {
        require(block.timestamp < battles[battleId].endTime, "battle ended");
        _;
    }

    function attack(uint256 battleId, MonsterType targetType)
        public
        onlyActiveBattle(battleId)
        onlyBeforeEnd(battleId)
    {
        Battle storage b = battles[battleId];

        // 내가 ETH에 베팅했다면 BTC 공격 가능, 반대도 동일
        uint256 userBet = (targetType == MonsterType.ETH)
            ? b.btcBets[msg.sender]
            : b.ethBets[msg.sender];
        require(userBet > 0, "no bet on opposite side");

        // 지금까지 사용한 공격 횟수(해당 타겟 기준)
        uint256 used = (targetType == MonsterType.ETH)
            ? usedAttacksAgainstETH[battleId][msg.sender]
            : usedAttacksAgainstBTC[battleId][msg.sender];
        
        uint256 totalOppBet = (targetType == MonsterType.ETH)
            ? b.btcBets[msg.sender]
            : b.ethBets[msg.sender];

        // 베팅한 금액만큼만 공격 가능(1 베팅 단위 = 1회 공격)
        require(totalOppBet > used, "no attack credits left");

        // 한 번 공격할 때 HP 1만큼만 감소
        uint256 damage = 1;

        if (targetType == MonsterType.ETH) {
            Monster storage ethM = monsters[b.ethMonsterId];
            require(ethM.currentHP > 0, "ETH dead");
            if (damage > ethM.currentHP) damage = ethM.currentHP;
            ethM.currentHP -= damage;
            emit Attacked(battleId, msg.sender, MonsterType.ETH, damage, ethM.currentHP);

            // 즉시 종료 체크
            if (ethM.currentHP == 0) {
                _finalizeWinner(battleId, MonsterType.BTC);
            }
        } else {
            Monster storage btcM = monsters[b.btcMonsterId];
            require(btcM.currentHP > 0, "BTC dead");
            if (damage > btcM.currentHP) damage = btcM.currentHP;
            btcM.currentHP -= damage;
            emit Attacked(battleId, msg.sender, MonsterType.BTC, damage, btcM.currentHP);

            if (btcM.currentHP == 0) {
                _finalizeWinner(battleId, MonsterType.ETH);
            }
        }
    }

    function endBattle(uint256 battleId) public {
        Battle storage b = battles[battleId];
        require(b.isActive, "already ended");

        Monster storage ethM = monsters[b.ethMonsterId];
        Monster storage btcM = monsters[b.btcMonsterId];

        // 한쪽이 이미 0이면 즉시 승자 확정 (공격 중간에 안 됐을 가능성 대비)
        if (ethM.currentHP == 0 && btcM.currentHP > 0) {
            _finalizeWinner(battleId, MonsterType.BTC);
            return;
        }
        if (btcM.currentHP == 0 && ethM.currentHP > 0) {
            _finalizeWinner(battleId, MonsterType.ETH);
            return;
        }

        // 시간 만료로 승자 결정 (무승부는 제외)
        require(block.timestamp >= b.endTime, "battle ongoing");

        if (ethM.currentHP > btcM.currentHP) {
            _finalizeWinner(battleId, MonsterType.ETH);
        } else if (btcM.currentHP > ethM.currentHP) {
            _finalizeWinner(battleId, MonsterType.BTC);
        } else {
            // 무승부 제외 사양: 그대로 revert로 처리하거나
            // 정책상 연장/관리자 종료 등으로 바꿔도 됨
            revert("draw not supported");
        }
    }

    function _finalizeWinner(uint256 battleId, MonsterType winner) internal {
        Battle storage b = battles[battleId];
        if (!b.isActive) return; // 중복 방지
        b.isActive = false;
        b.winner = winner;
        emit BattleEnded(battleId, winner);
    }

    // 보상 지급
    function claimReward(uint256 battleId) external {
        Battle storage battle = battles[battleId]; 
        require(!battle.isActive, "battle still active");
        require(!battle.claimed[msg.sender], "already claimed");

        uint256 reward = 0; 

        uint256 totalPool = battle.ethBettingPool + battle.btcBettingPool; 

        if (battle.winner == MonsterType.ETH) {
            if (battle.ethBets[msg.sender] > 0) {
                reward = (battle.ethBets[msg.sender] * totalPool) / battle.ethBettingPool;
                // 이더 전체 금액에서 자신의 비율만큼 전체 금액을 받음 
            }
        } else if (battle.winner == MonsterType.BTC) {
            if (battle.btcBets[msg.sender] > 0) {
                reward = (battle.btcBets[msg.sender] * totalPool) / battle.btcBettingPool;
            }
        } 

        battle.claimed[msg.sender] = true;
        require(reward > 0, "no reward");

        (bool ok, ) = payable(msg.sender).call{value: reward}("");
        require(ok, "transfer failed");

        emit RewardClaimed(battleId, msg.sender, reward);
    }

}

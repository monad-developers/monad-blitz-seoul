// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/AggregatorV3Interface.sol";

interface IPriceFeeds {
    function getETHPrice() external view returns (int256);
    function getBTCPrice() external view returns (int256);
}

contract BattleMonads {
    uint256 public constant MIN_BET = 0.01 ether;  // 0.01 MON
    uint256 public constant MAX_BET = 1 ether;     // 1 MON
    uint256 public constant BATTLE_DURATION = 12 hours; // 12시간
    uint256 public constant DEFAULT_HP = 100;

    enum MonsterType { ETH, BTC }

    struct Monster {
        uint256 id;
        MonsterType monsterType;
        uint256 birthPrice;      // 생성 시 가격 (8 decimals)
        uint256 currentHP;
        uint256 maxHP;
        uint256 createTime;
        bool exists;
    }

    struct Battle {
        uint256 battleId;
        uint256 ethMonsterId;
        uint256 btcMonsterId;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isSettled;
        MonsterType winner;
        uint256 ethBettingPool;
        uint256 btcBettingPool;
        mapping(address => uint256) ethBets;
        mapping(address => uint256) btcBets;
        mapping(address => bool) claimed;
        mapping(address => bool) canComment; // 베팅한 사용자만 댓글 가능
    }

    struct Comment {
        uint256 id;
        uint256 battleId;
        address user;
        string content;
        uint256 timestamp;
        bool isAttack;
        MonsterType attackTarget;
    }

    IPriceFeeds public priceFeeds;
    
    uint256 public nextMonsterId = 1;
    uint256 public nextBattleId = 1;
    uint256 public nextCommentId = 1;

    mapping(uint256 => Monster) public monsters;
    mapping(uint256 => Battle) private battles;
    mapping(uint256 => Comment[]) public battleComments;
    
    address public admin;

    event BattleCreated(uint256 indexed battleId, uint256 ethMonsterId, uint256 btcMonsterId, uint256 ethBirthPrice, uint256 btcBirthPrice);
    event BetPlaced(uint256 indexed battleId, address indexed user, MonsterType side, uint256 amount);
    event CommentAdded(uint256 indexed battleId, address indexed user, string content, bool isAttack, MonsterType attackTarget);
    event MonsterAttacked(uint256 indexed battleId, MonsterType target, uint256 damage, uint256 newHP);
    event BattleEnded(uint256 indexed battleId, MonsterType winner, uint256 ethFinalHP, uint256 btcFinalHP);
    event BattleSettled(uint256 indexed battleId, uint256 totalPayout);
    event RewardClaimed(uint256 indexed battleId, address indexed user, uint256 amount);

    constructor(address _priceFeeds) {
        admin = msg.sender;
        priceFeeds = IPriceFeeds(_priceFeeds);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyActiveBattle(uint256 battleId) {
        require(battles[battleId].isActive, "Battle not active");
        _;
    }

    modifier canCommentOnBattle(uint256 battleId) {
        require(battles[battleId].canComment[msg.sender], "Must bet to comment");
        _;
    }

    /// @notice 배틀 생성 (ETH vs BTC 몬스터 자동 생성 + 현재 가격 저장)
    function createBattle() external onlyAdmin returns (uint256 battleId) {
        // 현재 가격 가져오기
        int256 ethPrice = priceFeeds.getETHPrice();
        int256 btcPrice = priceFeeds.getBTCPrice();
        
        require(ethPrice > 0 && btcPrice > 0, "Invalid prices");

        // ETH 몬스터 생성
        uint256 ethMonsterId = nextMonsterId++;
        monsters[ethMonsterId] = Monster({
            id: ethMonsterId,
            monsterType: MonsterType.ETH,
            birthPrice: uint256(ethPrice),
            currentHP: DEFAULT_HP,
            maxHP: DEFAULT_HP,
            createTime: block.timestamp,
            exists: true
        });

        // BTC 몬스터 생성
        uint256 btcMonsterId = nextMonsterId++;
        monsters[btcMonsterId] = Monster({
            id: btcMonsterId,
            monsterType: MonsterType.BTC,
            birthPrice: uint256(btcPrice),
            currentHP: DEFAULT_HP,
            maxHP: DEFAULT_HP,
            createTime: block.timestamp,
            exists: true
        });

        // 배틀 생성
        battleId = nextBattleId++;
        Battle storage battle = battles[battleId];
        battle.battleId = battleId;
        battle.ethMonsterId = ethMonsterId;
        battle.btcMonsterId = btcMonsterId;
        battle.startTime = block.timestamp;
        battle.endTime = block.timestamp + BATTLE_DURATION;
        battle.isActive = true;

        emit BattleCreated(battleId, ethMonsterId, btcMonsterId, uint256(ethPrice), uint256(btcPrice));
    }

    /// @notice 베팅하기 (0.01 ~ 1 MON)
    function bet(uint256 battleId, MonsterType side) 
        external 
        payable 
        onlyActiveBattle(battleId) 
    {
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
        require(block.timestamp < battles[battleId].endTime, "Battle ended");

        Battle storage battle = battles[battleId];
        
        // 베팅 기록
        if (side == MonsterType.ETH) {
            battle.ethBets[msg.sender] += msg.value;
            battle.ethBettingPool += msg.value;
        } else {
            battle.btcBets[msg.sender] += msg.value;
            battle.btcBettingPool += msg.value;
        }

        // 댓글 권한 부여
        battle.canComment[msg.sender] = true;

        emit BetPlaced(battleId, msg.sender, side, msg.value);
    }

    /// @notice 댓글 달기 (베팅한 사용자만 가능)
    function addComment(uint256 battleId, string calldata content) 
        external 
        onlyActiveBattle(battleId)
        canCommentOnBattle(battleId)
    {
        require(block.timestamp < battles[battleId].endTime, "Battle ended");
        require(bytes(content).length > 0, "Empty comment");

        // "attack" 포함 여부 확인
        bool isAttack = _containsAttack(content);
        MonsterType attackTarget = MonsterType.ETH; // 기본값
        
        if (isAttack) {
            attackTarget = _executeAttack(battleId, msg.sender);
        }

        // 댓글 저장
        Comment memory newComment = Comment({
            id: nextCommentId++,
            battleId: battleId,
            user: msg.sender,
            content: content,
            timestamp: block.timestamp,
            isAttack: isAttack,
            attackTarget: attackTarget
        });

        battleComments[battleId].push(newComment);

        emit CommentAdded(battleId, msg.sender, content, isAttack, attackTarget);
    }

    /// @notice "attack" 문자열 포함 여부 확인
    function _containsAttack(string memory content) private pure returns (bool) {
        bytes memory contentBytes = bytes(content);
        bytes memory attackBytes = bytes("attack");
        
        if (contentBytes.length < attackBytes.length) return false;
        
        for (uint i = 0; i <= contentBytes.length - attackBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < attackBytes.length; j++) {
                if (contentBytes[i + j] != attackBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    /// @notice 공격 실행 로직
    function _executeAttack(uint256 battleId, address attacker) private returns (MonsterType) {
        Battle storage battle = battles[battleId];
        
        // 공격자가 어느 쪽에 베팅했는지 확인
        bool betOnETH = battle.ethBets[attacker] > 0;
        bool betOnBTC = battle.btcBets[attacker] > 0;
        
        require(betOnETH || betOnBTC, "No bet placed");
        
        // 반대편 공격 (ETH에 베팅했으면 BTC 공격, 반대도 마찬가지)
        MonsterType target;
        if (betOnETH && !betOnBTC) {
            target = MonsterType.BTC;
        } else if (betOnBTC && !betOnETH) {
            target = MonsterType.ETH;
        } else {
            // 양쪽 다 베팅한 경우 랜덤 또는 정책 결정
            target = MonsterType.BTC; // 기본적으로 BTC 공격
        }
        
        // 공격 실행 (HP 1 감소)
        uint256 damage = 1;
        if (target == MonsterType.ETH) {
            Monster storage ethMonster = monsters[battle.ethMonsterId];
            if (ethMonster.currentHP > 0) {
                ethMonster.currentHP -= damage;
                emit MonsterAttacked(battleId, MonsterType.ETH, damage, ethMonster.currentHP);
                
                // 즉시 승부 결정
                if (ethMonster.currentHP == 0) {
                    _endBattle(battleId);
                }
            }
        } else {
            Monster storage btcMonster = monsters[battle.btcMonsterId];
            if (btcMonster.currentHP > 0) {
                btcMonster.currentHP -= damage;
                emit MonsterAttacked(battleId, MonsterType.BTC, damage, btcMonster.currentHP);
                
                // 즉시 승부 결정
                if (btcMonster.currentHP == 0) {
                    _endBattle(battleId);
                }
            }
        }
        
        return target;
    }

    /// @notice 배틀 종료 (시간 만료 또는 HP 0)
    function endBattle(uint256 battleId) external {
        Battle storage battle = battles[battleId];
        require(battle.isActive, "Battle not active");
        require(
            block.timestamp >= battle.endTime || 
            monsters[battle.ethMonsterId].currentHP == 0 || 
            monsters[battle.btcMonsterId].currentHP == 0,
            "Battle still ongoing"
        );
        
        _endBattle(battleId);
    }

    function _endBattle(uint256 battleId) private {
        Battle storage battle = battles[battleId];
        Monster storage ethMonster = monsters[battle.ethMonsterId];
        Monster storage btcMonster = monsters[battle.btcMonsterId];
        
        // 승자 결정
        if (ethMonster.currentHP > btcMonster.currentHP) {
            battle.winner = MonsterType.ETH;
        } else if (btcMonster.currentHP > ethMonster.currentHP) {
            battle.winner = MonsterType.BTC;
        } else {
            // 무승부 시 베팅 금액이 많은 쪽이 승리
            if (battle.ethBettingPool >= battle.btcBettingPool) {
                battle.winner = MonsterType.ETH;
            } else {
                battle.winner = MonsterType.BTC;
            }
        }
        
        battle.isActive = false;
        emit BattleEnded(battleId, battle.winner, ethMonster.currentHP, btcMonster.currentHP);
        
        // 자동 정산
        _settleBattle(battleId);
    }

    /// @notice 자동 정산
    function _settleBattle(uint256 battleId) private {
        Battle storage battle = battles[battleId];
        require(!battle.isSettled, "Already settled");
        
        uint256 totalPool = battle.ethBettingPool + battle.btcBettingPool;
        battle.isSettled = true;
        
        emit BattleSettled(battleId, totalPool);
    }

    /// @notice 보상 청구
    function claimReward(uint256 battleId) external {
        Battle storage battle = battles[battleId];
        require(battle.isSettled, "Battle not settled");
        require(!battle.claimed[msg.sender], "Already claimed");
        
        uint256 reward = 0;
        uint256 totalPool = battle.ethBettingPool + battle.btcBettingPool;
        
        if (battle.winner == MonsterType.ETH && battle.ethBets[msg.sender] > 0) {
            // ETH 승리 시 ETH 베팅자들에게 보상
            reward = (battle.ethBets[msg.sender] * totalPool) / battle.ethBettingPool;
        } else if (battle.winner == MonsterType.BTC && battle.btcBets[msg.sender] > 0) {
            // BTC 승리 시 BTC 베팅자들에게 보상
            reward = (battle.btcBets[msg.sender] * totalPool) / battle.btcBettingPool;
        }
        
        require(reward > 0, "No reward");
        
        battle.claimed[msg.sender] = true;
        
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(battleId, msg.sender, reward);
    }

    // View functions
    function getBattle(uint256 battleId) external view returns (
        uint256 id,
        uint256 ethMonsterId,
        uint256 btcMonsterId,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isSettled,
        MonsterType winner,
        uint256 ethPool,
        uint256 btcPool
    ) {
        Battle storage battle = battles[battleId];
        return (
            battle.battleId,
            battle.ethMonsterId,
            battle.btcMonsterId,
            battle.startTime,
            battle.endTime,
            battle.isActive,
            battle.isSettled,
            battle.winner,
            battle.ethBettingPool,
            battle.btcBettingPool
        );
    }

    function getUserBets(uint256 battleId, address user) external view returns (uint256 ethBet, uint256 btcBet) {
        Battle storage battle = battles[battleId];
        return (battle.ethBets[user], battle.btcBets[user]);
    }

    function getBattleComments(uint256 battleId) external view returns (Comment[] memory) {
        return battleComments[battleId];
    }

    function canUserComment(uint256 battleId, address user) external view returns (bool) {
        return battles[battleId].canComment[user];
    }
}
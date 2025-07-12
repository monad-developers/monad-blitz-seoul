// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/access/Ownable.sol";

contract MonadClickerGame is Ownable {
    struct User {
        uint256 power;
        uint256 lv;
        uint256 enemyHp;
        uint256 enemyMaxHp;
        uint256 gold;
        bool exists;
    }

    mapping(address => User) public users;

    uint256 public constant INITIAL_POWER = 3;
    uint256 public constant INITIAL_LV = 1;
    uint256 public constant INITIAL_ENEMY_HP = 10;

    event UserCreated(address user);
    event EnemyAttacked(address user, uint256 newEnemyHp, uint256 xpGained);

    modifier userExists(address user) {
        require(users[user].exists, "User does not exist");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createUser(address userAddress) external onlyOwner {
        require(!users[userAddress].exists, "User already exists");

        users[userAddress] = User({
            power: INITIAL_POWER,
            lv: INITIAL_LV,
            enemyHp: INITIAL_ENEMY_HP,
            enemyMaxHp: INITIAL_ENEMY_HP,
            gold: 0,
            exists: true
        });

        emit UserCreated(userAddress);
    }

    function attackEnemy(address userAddress) external userExists(userAddress) onlyOwner returns (uint256) {
        User storage user = users[userAddress];

        if (user.enemyHp <= user.power) {
            // 보스 처치: 레벨업 및 유사 랜덤 골드 획득
            user.lv += 1;
            user.power += user.lv;
            user.enemyMaxHp += 5;
            user.enemyHp = user.enemyMaxHp;

            uint256 randomGold = (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        userAddress
                    )
                )
            ) % 10) + 1;

            user.gold += randomGold;

            emit EnemyAttacked(userAddress, 0, randomGold);
            return 0;
        } else {
            // 일반 공격
            user.enemyHp -= user.power;
            emit EnemyAttacked(userAddress, user.enemyHp, 0);
            return user.enemyHp;
        }
    }

    function getUser(address userAddress) external view returns (User memory) {
        return users[userAddress];
    }
}
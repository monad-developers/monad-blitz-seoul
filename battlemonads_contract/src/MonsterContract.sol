// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MonsterTypes.sol";

struct Monster {
    uint256 id;
    MonsterType monsterType; 
    uint256 birthPrice;      
    uint256 currentHP;       // 현재 HP (초기값 100)
    uint256 maxHP;           // 최대 HP (100)
    uint256 lastUpdateTime;  
    address owner;           
    bool exists;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MonsterTypes.sol";

/**
 * @dev 몬스터 상태만 보관하는 스토리지 정의
 * HP 규칙: 초기 HP = 100, 공격 시마다 -1
 */
struct Monster {
    uint256 id;
    MonsterType monsterType; // ETH or BTC
    uint256 birthPrice;      // 초기값 0, 참여하면 증가
    uint256 currentHP;       // 현재 HP (초기값 100)
    uint256 maxHP;           // 최대 HP (100)
    uint256 lastUpdateTime;  // 향후 확장용 (현재 로직에선 의미 없음)
    address owner;           // 소유자, 배틀 생성한 주소
    bool exists;             // 존재 여부
}

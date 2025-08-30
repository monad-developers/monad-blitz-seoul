// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MonsterTypes.sol";

/**
 * @dev 배틀 관련 상태만 보관하는 스토리지 정의
 * - 베팅 풀: 네이티브 ETH(wei) 기준
 * - 유저별 베팅액: 승자/패자 구분하여 맵으로 관리
 * - 개별 청구(Claim) 방식으로 분배
 */
struct Battle {
    uint256 battleId;        // 배틀 ID
    uint256 ethMonsterId;    // ETH 몬스터 ID
    uint256 btcMonsterId;    // BTC 몬스터 ID

    uint256 startTime;       // 배틀 생성된 시간 기록
    uint256 endTime;         
    bool isActive;           // 배틀 활성화 여부 

    MonsterType winner;
    uint256 ethBettingPool;
    uint256 btcBettingPool;
    mapping(address => uint256) ethBets;
    mapping(address => uint256) btcBets;
    mapping(address => bool) claimed;
}

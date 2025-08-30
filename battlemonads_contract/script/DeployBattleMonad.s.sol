// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/BattleContract.sol";

contract DeployBattleMonad is Script {
    function run() external {
        vm.startBroadcast();
        
        // MonsterBattle 컨트랙트 배포
        MonsterBattle battle = new MonsterBattle();
        
        console.log("MonsterBattle deployed to:", address(battle));
        console.log("Admin address:", battle.admin());
        console.log("Next Monster ID:", battle.nextMonsterId());
        console.log("Next Battle ID:", battle.nextBattleId());
        
        // 테스트 배틀 생성
        uint256 battleId = battle.createBattle(100);
        console.log("Test battle created with ID:", battleId);
        
        vm.stopBroadcast();
    }
}
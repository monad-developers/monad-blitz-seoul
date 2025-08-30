// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/BattleMonads.sol";

contract DeployBattleMonads is Script {
    // 이미 배포된 PriceFeeds 컨트랙트 주소
    address constant PRICE_FEEDS_ADDRESS = 0x2DE6e6e7f8CA732137775DF4Cff65571D47Db3Fd;
    
    function run() external {
        vm.startBroadcast();
        
        // BattleMonads 컨트랙트 배포
        BattleMonads battleMonads = new BattleMonads(PRICE_FEEDS_ADDRESS);
        
        console.log("BattleMonads deployed to:", address(battleMonads));
        console.log("Admin:", battleMonads.admin());
        console.log("PriceFeeds address:", address(battleMonads.priceFeeds()));
        console.log("Min bet:", battleMonads.MIN_BET() / 1 ether, "MON");
        console.log("Max bet:", battleMonads.MAX_BET() / 1 ether, "MON");
        console.log("Battle duration:", battleMonads.BATTLE_DURATION() / 3600, "hours");
        
        // 첫 번째 배틀 생성
        uint256 battleId = battleMonads.createBattle();
        console.log("First battle created with ID:", battleId);
        
        // 배틀 정보 조회
        (
            uint256 id,
            uint256 ethMonsterId,
            uint256 btcMonsterId,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isSettled,
            BattleMonads.MonsterType winner,
            uint256 ethPool,
            uint256 btcPool
        ) = battleMonads.getBattle(battleId);
        
        console.log("Battle ID:", id);
        console.log("ETH Monster ID:", ethMonsterId);
        console.log("BTC Monster ID:", btcMonsterId);
        console.log("Is Active:", isActive);
        console.log("ETH Pool:", ethPool);
        console.log("BTC Pool:", btcPool);
        
        vm.stopBroadcast();
    }
}
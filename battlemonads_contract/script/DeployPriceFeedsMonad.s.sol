// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PriceFeeds.sol";

contract DeployPriceFeedsMonad is Script {
    function run() external {
        vm.startBroadcast();
        
        // Monad testnet에 PriceFeeds 배포
        PriceFeeds priceFeeds = new PriceFeeds();
        
        console.log("PriceFeeds deployed to:", address(priceFeeds));
        
        // 배포 후 테스트 호출
        try priceFeeds.getETHPrice() returns (int256 ethPrice) {
            console.log("ETH Price:", uint256(ethPrice));
        } catch {
            console.log("Failed to get ETH price - oracle might not be available");
        }
        
        try priceFeeds.getBTCPrice() returns (int256 btcPrice) {
            console.log("BTC Price:", uint256(btcPrice));
        } catch {
            console.log("Failed to get BTC price - oracle might not be available");
        }
        
        vm.stopBroadcast();
    }
}
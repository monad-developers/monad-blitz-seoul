// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PriceFeeds.sol";

contract DeployPriceFeeds is Script {
    function run() external returns (PriceFeeds) {
        vm.startBroadcast();
        
        PriceFeeds priceFeeds = new PriceFeeds();
        
        console.log("PriceFeeds deployed at:", address(priceFeeds));
        
        int256 btcPrice = priceFeeds.getBTCPrice();
        int256 ethPrice = priceFeeds.getETHPrice();
        
        console.log("Current BTC Price: $", uint256(btcPrice) / 1e8);
        console.log("Current ETH Price: $", uint256(ethPrice) / 1e8);
        
        vm.stopBroadcast();
        
        return priceFeeds;
    }
}
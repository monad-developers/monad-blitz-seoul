// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PriceFeeds.sol";

contract GetPrices is Script {
    function run() external {
        // Deploy and get prices
        PriceFeeds priceFeeds = new PriceFeeds();
        
        // Get BTC price
        int256 btcPrice = priceFeeds.getBTCPrice();
        console.log("=================================");
        console.log("BTC/USD Raw Price:", uint256(btcPrice));
        console.log("BTC Price: $", uint256(btcPrice) / 1e8);
        console.log("=================================");
        
        // Get ETH price
        int256 ethPrice = priceFeeds.getETHPrice();
        console.log("ETH/USD Raw Price:", uint256(ethPrice));
        console.log("ETH Price: $", uint256(ethPrice) / 1e8);
        console.log("=================================");
        
        // Get prices with timestamps
        (int256 btcPrice2, uint256 btcTimestamp) = priceFeeds.getBTCPriceWithTimestamp();
        (int256 ethPrice2, uint256 ethTimestamp) = priceFeeds.getETHPriceWithTimestamp();
        
        console.log("BTC Last Updated:", btcTimestamp);
        console.log("ETH Last Updated:", ethTimestamp);
        console.log("=================================");
    }
}
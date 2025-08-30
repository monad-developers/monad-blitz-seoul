// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PriceFeeds.sol";

contract PriceFeedsTest is Test {
    PriceFeeds public priceFeeds;
    
    function setUp() public {
        // Sepolia 포크
        priceFeeds = new PriceFeeds();
    }
    
    function testGetBTCPrice() public view {
        int256 btcPrice = priceFeeds.getBTCPrice();
        console.log("BTC/USD Price:", uint256(btcPrice));
        console.log("BTC Price in dollars:", uint256(btcPrice) / 1e8);
        
        // 가격이 0보다 큰지 확인
        assertGt(btcPrice, 0);
    }
    
    function testGetETHPrice() public view {
        int256 ethPrice = priceFeeds.getETHPrice();
        console.log("ETH/USD Price:", uint256(ethPrice));
        console.log("ETH Price in dollars:", uint256(ethPrice) / 1e8);
        
        // 가격이 0보다 큰지 확인
        assertGt(ethPrice, 0);
    }
    
    function testGetPricesWithTimestamp() public view {
        (int256 btcPrice, uint256 btcTimestamp) = priceFeeds.getBTCPriceWithTimestamp();
        (int256 ethPrice, uint256 ethTimestamp) = priceFeeds.getETHPriceWithTimestamp();
        
        console.log("BTC Price:", uint256(btcPrice) / 1e8, "USD at timestamp:", btcTimestamp);
        console.log("ETH Price:", uint256(ethPrice) / 1e8, "USD at timestamp:", ethTimestamp);
        
        // 타임스탬프가 0보다 큰지 확인
        assertGt(btcTimestamp, 0);
        assertGt(ethTimestamp, 0);
    }
    
    function testGetDecimals() public view {
        uint8 btcDecimals = priceFeeds.getDecimals(0x5fb1616F78dA7aFC9FF79e0371741a747D2a7F22);
        uint8 ethDecimals = priceFeeds.getDecimals(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        
        console.log("BTC/USD decimals:", btcDecimals);
        console.log("ETH/USD decimals:", ethDecimals);
        
        // Chainlink 표준은 8 decimals
        assertEq(btcDecimals, 8);
        assertEq(ethDecimals, 8);
    }
}
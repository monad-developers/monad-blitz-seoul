// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/AggregatorV3Interface.sol";

contract PriceFeeds {
    AggregatorV3Interface internal btcUsdPriceFeed;
    AggregatorV3Interface internal ethUsdPriceFeed;

    /**
     * Network: monad testnet
     * BTC/USD: 0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31
     * ETH/USD: 0x0c76859E85727683Eeba0C70Bc2e0F5781337818
     */
    constructor() {
        btcUsdPriceFeed = AggregatorV3Interface(0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31);
        ethUsdPriceFeed = AggregatorV3Interface(0x0c76859E85727683Eeba0C70Bc2e0F5781337818);
    }

    function getBTCPrice() public view returns (int256) {
        (
            ,
            int256 price,
            ,
            ,
            
        ) = btcUsdPriceFeed.latestRoundData();
        return price;
    }

    function getETHPrice() public view returns (int256) {
        (
            ,
            int256 price,
            ,
            ,
            
        ) = ethUsdPriceFeed.latestRoundData();
        return price;
    }

    function getBTCPriceWithTimestamp() public view returns (int256, uint256) {
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = btcUsdPriceFeed.latestRoundData();
        return (price, updatedAt);
    }

    function getETHPriceWithTimestamp() public view returns (int256, uint256) {
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = ethUsdPriceFeed.latestRoundData();
        return (price, updatedAt);
    }

    function getDecimals(address priceFeed) public view returns (uint8) {
        return AggregatorV3Interface(priceFeed).decimals();
    }
}
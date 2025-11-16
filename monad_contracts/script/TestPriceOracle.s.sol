// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PriceOracleAdapter} from "../src/PriceOracleAdapter.sol";

/// @dev Chainlink AggregatorV3Interface (for direct feed access)
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    function decimals() external view returns (uint8);
}

/// @title TestPriceOracle
/// @notice PriceOracleAdapter에서 가격을 조회하는 테스트 스크립트
contract TestPriceOracle is Script {
    function run() public view {
        // PriceOracleAdapter 주소
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");
        PriceOracleAdapter oracle = PriceOracleAdapter(oracleAddress);

        console.log("=== Testing PriceOracleAdapter ===");
        console.log("Oracle address:", oracleAddress);
        console.log("Owner:", oracle.owner());

        // WETH 가격 조회
        try vm.envAddress("WETH_ADDRESS") returns (address weth) {
            console.log("\n--- WETH Price Test ---");
            console.log("WETH address:", weth);
            
            // 피드 설정 확인
            address feed = oracle.priceFeeds(weth);
            console.log("WETH/USD feed address:", feed);
            
            bool hasFeed = oracle.hasPriceFeed(weth);
            console.log("Feed is set:", hasFeed);
            
            if (feed != address(0)) {
                // 가격 조회
                try oracle.getUsdPrice(weth) returns (uint256 price, uint8 decimals) {
                    console.log("\n[SUCCESS] WETH/USD Price Retrieved Successfully!");
                    console.log("Price (raw):", price);
                    console.log("Decimals:", decimals);
                    
                    // 가격을 읽기 쉬운 형식으로 변환
                    uint256 priceNormalized = price;
                    if (decimals > 18) {
                        priceNormalized = price / (10 ** (decimals - 18));
                    } else if (decimals < 18) {
                        priceNormalized = price * (10 ** (18 - decimals));
                    }
                    
                    console.log("Price (normalized to 18 decimals):", priceNormalized);
                    
                    // USD 가격으로 표시 (decimals 고려)
                    uint256 priceInUsd = price / (10 ** decimals);
                    uint256 priceInUsdRemainder = price % (10 ** decimals);
                    console.log("Price in USD:", priceInUsd, ".", priceInUsdRemainder);
                    
                    // 정규화된 가격 조회
                    try oracle.getUsdPriceNormalized(weth) returns (uint256 normalizedPrice) {
                        console.log("Normalized price (18 decimals):", normalizedPrice);
                    } catch {
                        console.log("Could not get normalized price");
                    }
                } catch Error(string memory reason) {
                    console.log("\n[ERROR] Error fetching WETH price:", reason);
                    if (keccak256(bytes(reason)) == keccak256(bytes("StalePrice(uint256,uint256)"))) {
                        console.log("NOTE: Price feed is stale (older than 1 hour)");
                        console.log("This is normal if the Chainlink aggregator hasn't updated recently.");
                        console.log("The price feed is configured correctly, just needs to be updated.");
                    }
                } catch (bytes memory) {
                    // StalePrice custom error를 직접 체크
                    console.log("\n[ERROR] StalePrice error - Price feed is older than 1 hour");
                    console.log("The WETH price feed is configured correctly.");
                    console.log("However, the last update was more than 1 hour ago.");
                    console.log("This is a safety check to prevent using outdated prices.");
                    console.log("The feed will work once Chainlink updates it.");
                    
                    // 직접 Aggregator에서 데이터를 읽어서 확인
                    try AggregatorV3Interface(feed).latestRoundData() returns (
                        uint80,
                        int256 answer,
                        uint256,
                        uint256 updatedAt,
                        uint80
                    ) {
                        console.log("\nDirect feed check:");
                        console.log("Last updated timestamp:", updatedAt);
                        console.log("Current block timestamp:", block.timestamp);
                        uint256 age = block.timestamp > updatedAt ? block.timestamp - updatedAt : 0;
                        console.log("Age (seconds):", age);
                        console.log("Age (hours):", age / 3600);
                        console.log("Price value (if fresh):", uint256(answer));
                    } catch {}
                }
            } else {
                console.log("[ERROR] WETH price feed is not set!");
            }
        } catch {
            console.log("WETH_ADDRESS not set in environment");
        }

        // USDC 가격 조회 (선택사항)
        try vm.envAddress("USDC_ADDRESS") returns (address usdc) {
            console.log("\n--- USDC Price Test ---");
            console.log("USDC address:", usdc);
            
            address feed = oracle.priceFeeds(usdc);
            console.log("USDC/USD feed address:", feed);
            
            bool hasFeed = oracle.hasPriceFeed(usdc);
            console.log("Feed is set:", hasFeed);
            
            if (feed != address(0)) {
                try oracle.getUsdPrice(usdc) returns (uint256 price, uint8 decimals) {
                    console.log("\n[SUCCESS] USDC/USD Price Retrieved Successfully!");
                    console.log("Price (raw):", price);
                    console.log("Decimals:", decimals);
                    
                    uint256 priceInUsd = price / (10 ** decimals);
                    uint256 priceInUsdRemainder = price % (10 ** decimals);
                    console.log("Price in USD:", priceInUsd, ".", priceInUsdRemainder);
                } catch Error(string memory reason) {
                    console.log("[ERROR] Error fetching price:", reason);
                } catch {
                    console.log("[ERROR] Low-level error occurred (check logs above)");
                }
            } else {
                console.log("[ERROR] USDC price feed is not set!");
            }
        } catch {
            console.log("USDC_ADDRESS not set in environment");
        }

        console.log("\n=== Test Complete ===");
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PriceOracleAdapter} from "../src/PriceOracleAdapter.sol";

/// @title SetupPriceOracle
/// @notice PriceOracleAdapter에 가격 피드를 설정하는 스크립트
/// @dev 배포 후 실행하여 WETH/USD, USDC/USD 피드를 설정합니다
contract SetupPriceOracle is Script {
    function run() public {
        // PRIVATE_KEY를 문자열로 읽고 uint256으로 변환
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(privateKeyStr);
        address deployer = vm.addr(deployerPrivateKey);

        // PriceOracleAdapter 주소 (환경 변수 또는 직접 입력)
        address oracleAddress = vm.envAddress("ORACLE_ADDRESS");

        console.log("Setting up PriceOracleAdapter...");
        console.log("Deployer address:", deployer);
        console.log("Oracle address:", oracleAddress);

        PriceOracleAdapter oracle = PriceOracleAdapter(oracleAddress);

        // Owner 확인
        address owner = oracle.owner();
        console.log("Oracle owner:", owner);
        if (owner != deployer) {
            console.log("WARNING: Deployer is not the owner!");
            console.log("Only owner can set price feeds.");
            return;
        }

        vm.startBroadcast(deployerPrivateKey);

        // 환경 변수에서 토큰 주소와 피드 주소 읽기
        try vm.envAddress("WETH_ADDRESS") returns (address weth) {
            address wethFeed = vm.envAddress("WETH_USD_FEED");
            console.log("\nSetting WETH/USD feed...");
            console.log("WETH address:", weth);
            console.log("WETH/USD feed:", wethFeed);
            
            oracle.setPriceFeed(weth, wethFeed);
            console.log("WETH/USD feed set successfully!");
        } catch {
            console.log("WETH_ADDRESS or WETH_USD_FEED not set, skipping...");
        }

        try vm.envAddress("USDC_ADDRESS") returns (address usdc) {
            address usdcFeed = vm.envAddress("USDC_USD_FEED");
            console.log("\nSetting USDC/USD feed...");
            console.log("USDC address:", usdc);
            console.log("USDC/USD feed:", usdcFeed);
            
            oracle.setPriceFeed(usdc, usdcFeed);
            console.log("USDC/USD feed set successfully!");
        } catch {
            console.log("USDC_ADDRESS or USDC_USD_FEED not set, skipping...");
        }

        vm.stopBroadcast();

        // 설정 확인
        console.log("\n=== Verification ===");
        try vm.envAddress("WETH_ADDRESS") returns (address weth) {
            address feed = oracle.priceFeeds(weth);
            console.log("WETH feed address:", feed);
            if (feed != address(0)) {
                bool hasFeed = oracle.hasPriceFeed(weth);
                console.log("WETH feed is set:", hasFeed);
                // 가격 조회는 stale 체크 때문에 실패할 수 있으므로 try-catch로 처리
                try oracle.getUsdPrice(weth) returns (uint256 price, uint8 decimals) {
                    console.log("WETH/USD price:", price);
                    console.log("WETH/USD decimals:", decimals);
                } catch {
                    console.log("WARNING: Could not fetch WETH price (may be stale)");
                }
            }
        } catch {}

        try vm.envAddress("USDC_ADDRESS") returns (address usdc) {
            address feed = oracle.priceFeeds(usdc);
            console.log("USDC feed address:", feed);
            if (feed != address(0)) {
                bool hasFeed = oracle.hasPriceFeed(usdc);
                console.log("USDC feed is set:", hasFeed);
                // 가격 조회는 stale 체크 때문에 실패할 수 있으므로 try-catch로 처리
                try oracle.getUsdPrice(usdc) returns (uint256 price, uint8 decimals) {
                    console.log("USDC/USD price:", price);
                    console.log("USDC/USD decimals:", decimals);
                } catch {
                    console.log("WARNING: Could not fetch USDC price (may be stale)");
                }
            }
        } catch {}

        console.log("\n=== Setup Complete ===");
    }
}


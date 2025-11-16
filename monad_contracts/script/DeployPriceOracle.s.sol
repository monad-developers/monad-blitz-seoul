// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PriceOracleAdapter} from "../src/PriceOracleAdapter.sol";

/// @title DeployPriceOracle
/// @notice PriceOracleAdapter를 Monad 테스트넷에 배포하는 스크립트
contract DeployPriceOracle is Script {
    function run() public {
        // PRIVATE_KEY를 문자열로 읽고 uint256으로 변환 (0x 접두사 자동 처리)
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(privateKeyStr);
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying PriceOracleAdapter...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        PriceOracleAdapter oracle = new PriceOracleAdapter();

        vm.stopBroadcast();

        console.log("PriceOracleAdapter deployed at:", address(oracle));
        console.log("Owner:", oracle.owner());
    }
}


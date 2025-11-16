// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TokenSender} from "../src/TokenSender.sol";

/// @title DeployTokenSender
/// @notice TokenSender를 Monad 테스트넷에 배포하는 스크립트
contract DeployTokenSender is Script {
    function run() public {
        // PRIVATE_KEY를 문자열로 읽고 uint256으로 변환
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(privateKeyStr);
        address deployer = vm.addr(deployerPrivateKey);

        // 환경 변수에서 주소 읽기
        address ccipRouter = vm.envAddress("CCIP_ROUTER_ADDRESS");
        string memory chainSelectorStr = vm.envString("DEST_CHAIN_SELECTOR");
        uint64 destChainSelector = uint64(vm.parseUint(chainSelectorStr));
        
        // feeToken은 선택사항 (기본값: address(0) = native)
        address feeToken = address(0);
        try vm.envAddress("FEE_TOKEN_ADDRESS") returns (address token) {
            feeToken = token;
        } catch {
            console.log("FEE_TOKEN_ADDRESS not set - using native token (address(0))");
        }

        console.log("Deploying TokenSender...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("CCIP Router address:", ccipRouter);
        console.log("Destination chain selector:", destChainSelector);
        console.log("Fee token:", feeToken);
        if (feeToken == address(0)) {
            console.log("  -> Using native token for fees");
        } else {
            console.log("  -> Using ERC20 token for fees");
        }

        vm.startBroadcast(deployerPrivateKey);

        TokenSender sender = new TokenSender(
            ccipRouter,
            destChainSelector,
            feeToken
        );

        vm.stopBroadcast();

        console.log("\nTokenSender deployed at:", address(sender));
        console.log("Owner:", sender.owner());
        console.log("CCIP Router:", sender.ccipRouter());
        console.log("Destination chain selector:", sender.destinationChainSelector());
        console.log("Fee token:", sender.feeToken());
    }
}


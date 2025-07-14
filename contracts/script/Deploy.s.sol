// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/Canvas.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        new Canvas(64, 64);
        vm.stopBroadcast();
    }
}
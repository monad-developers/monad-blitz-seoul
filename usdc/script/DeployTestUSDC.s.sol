// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Counter.sol";

/// @notice Deploys TestUSDC (tUSDC) with an initial 6-decimal supply minted to an owner.
contract DeployTestUSDC is Script {
    uint256 internal constant DECIMALS = 1e6; // 6 decimals

    function run() external {
        address owner = vm.envAddress("USDC_OWNER");
        uint256 supplyWhole = vm.envUint("USDC_INITIAL_SUPPLY"); // e.g. 1_000_000 for 1M tokens
        uint256 mintAmount = supplyWhole * DECIMALS;

        vm.startBroadcast();
        TestUSDC token = new TestUSDC(owner, mintAmount);
        vm.stopBroadcast();

        console2.log("TestUSDC deployed:", address(token));
        console2.log("Owner:", owner);
        console2.log("Initial supply (whole tokens):", supplyWhole);
        console2.log("Initial supply (raw 6 decimals):", mintAmount);
    }
}

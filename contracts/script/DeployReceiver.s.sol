// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Receiver.sol";

/// @notice Foundry script to deploy the CCIP Receiver on a destination EVM chain.
/// @dev Parameters are pulled from environment variables to avoid hardcoding
///      per-network addresses. Provide them when running `forge script`.
///      Excludes non-EVM lanes like Solana and omits Sonic/Katana by default.
contract DeployReceiver is Script {
    struct Params {
        address router;              // Destination chain CCIP Router address
        uint64 sourceChainSelector;  // Monad testnet selector (source)
        address sourceSender;        // Source-chain Router contract address
        address usdc;                // Destination chain USDC token address
    }

    function run() external {
        Params memory p = _loadParams();

        vm.startBroadcast();
        Receiver receiver = new Receiver(p.router, p.sourceChainSelector, p.sourceSender, p.usdc);
        vm.stopBroadcast();

        console2.log("Receiver deployed:", address(receiver));
        console2.log("Router:", p.router);
        console2.log("Source selector:", p.sourceChainSelector);
        console2.log("Source sender:", p.sourceSender);
        console2.log("USDC:", p.usdc);
    }

    /// @dev Loads parameters from env vars to keep the script network-agnostic.
    /// Required:
    /// - ROUTER: destination CCIP Router address
    /// - SOURCE_CHAIN_SELECTOR: selector for Monad testnet (uint64)
    /// - SOURCE_SENDER: source Router contract address (encoded in message.sender)
    /// - USDC: destination chain USDC token address
    function _loadParams() internal view returns (Params memory p) {
        p.router = vm.envAddress("ROUTER");
        p.sourceChainSelector = uint64(vm.envUint("SOURCE_CHAIN_SELECTOR"));
        p.sourceSender = vm.envAddress("SOURCE_SENDER");
        p.usdc = vm.envAddress("USDC");
    }
}

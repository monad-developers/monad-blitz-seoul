//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Deploy.s.sol";

/**
 * @notice Deployment script specifically for Monad testnet
 * @dev Uses environment variables from .env file
 */
contract DeployMonad is DeployScript {
    function run() external override {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting with the private key
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy all contracts using the parent script logic
        super.run();
        
        vm.stopBroadcast();
    }
}
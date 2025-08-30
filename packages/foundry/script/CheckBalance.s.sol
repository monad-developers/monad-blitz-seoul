//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/MdtToken.sol";

contract CheckBalance is Script {
    function run() external view {
        // Read deployment addresses
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/deployments/");
        uint256 chainId = block.chainid;
        string memory chainIdStr = vm.toString(chainId);
        path = string.concat(path, string.concat(chainIdStr, ".json"));
        
        string memory json = vm.readFile(path);
        
        // Parse all addresses and find MdtToken
        string[] memory keys = vm.parseJsonKeys(json, "$");
        address mdtTokenAddress;
        
        for (uint i = 0; i < keys.length; i++) {
            string memory contractName = vm.parseJsonString(json, string.concat(".", keys[i]));
            if (keccak256(bytes(contractName)) == keccak256(bytes("MdtToken"))) {
                mdtTokenAddress = vm.parseAddress(keys[i]);
                break;
            }
        }
        
        console.log("========================================");
        console.log("MDT Token Balance Check");
        console.log("========================================");
        console.log("Chain ID:", chainId);
        console.log("MDT Token Address:", mdtTokenAddress);
        console.log("");
        
        // Get deployer address from environment
        address deployer;
        if (chainId == 31337) {
            // Local: use LOCAL_PRIVATE_KEY from .env
            uint256 deployerKey = vm.envUint("LOCAL_PRIVATE_KEY");
            deployer = vm.addr(deployerKey);
        } else if (chainId == 10143) {
            // Monad: use MONAD_PRIVATE_KEY
            uint256 deployerKey = vm.envUint("MONAD_PRIVATE_KEY");
            deployer = vm.addr(deployerKey);
        } else {
            // Default to PRIVATE_KEY
            uint256 deployerKey = vm.envUint("PRIVATE_KEY");
            deployer = vm.addr(deployerKey);
        }
        
        console.log("Deployer Address:", deployer);
        console.log("Deployer Address (checksum):", vm.toString(deployer));
        
        if (mdtTokenAddress == address(0)) {
            console.log("[ERROR] MdtToken address not found in deployment file!");
            console.log("Please deploy contracts first using 'yarn deploy:local' or 'yarn deploy:monad'");
            return;
        }
        
        // Get balance
        MdtToken mdtToken = MdtToken(mdtTokenAddress);
        uint256 balance = mdtToken.balanceOf(deployer);
        uint256 totalSupply = mdtToken.totalSupply();
        
        console.log("");
        console.log("Deployer MDT Balance:", balance / 1e18, "MDT");
        console.log("Deployer MDT Balance (wei):", balance);
        console.log("");
        console.log("Total Supply:", totalSupply / 1e18, "MDT");
        console.log("Total Supply (wei):", totalSupply);
        console.log("========================================");
        
        // Check if deployer has expected 1M tokens
        if (balance == 1_000_000 * 1e18) {
            console.log("[SUCCESS] Deployer has the expected 1,000,000 MDT tokens!");
        } else if (balance > 0) {
            console.log("[WARNING] Deployer has MDT tokens but not the expected 1M amount");
        } else {
            console.log("[ERROR] Deployer has no MDT tokens!");
        }
    }
}
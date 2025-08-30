//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../contracts/MdtToken.sol";

contract FindTokenOwner is Script {
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
        console.log("MDT Token Owner Investigation");
        console.log("========================================");
        console.log("MDT Token Address:", mdtTokenAddress);
        console.log("");
        
        if (mdtTokenAddress == address(0)) {
            console.log("[ERROR] MdtToken not found!");
            return;
        }
        
        MdtToken mdtToken = MdtToken(mdtTokenAddress);
        
        // Check Anvil default accounts
        address[10] memory anvilAccounts = [
            0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906,
            0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65,
            0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc,
            0x976EA74026E726554dB657fA54763abd0C3a0aa9,
            0x14dC79964da2C08b23698B3D3cc7Ca32193d9955,
            0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f,
            0xa0Ee7A142d267C1f36714E4a8F75612F20a79720
        ];
        
        console.log("Checking Anvil default accounts for MDT balance:");
        console.log("");
        
        for (uint i = 0; i < anvilAccounts.length; i++) {
            uint256 balance = mdtToken.balanceOf(anvilAccounts[i]);
            if (balance > 0) {
                console.log("Account", i, ":", anvilAccounts[i]);
                console.log("  Balance:", balance / 1e18, "MDT");
                console.log("  [FOUND] This account has MDT tokens!");
                console.log("");
            }
        }
        
        // Check contract owner
        address owner = mdtToken.owner();
        uint256 ownerBalance = mdtToken.balanceOf(owner);
        console.log("Contract Owner:", owner);
        console.log("Owner Balance:", ownerBalance / 1e18, "MDT");
        
        // Check total supply
        console.log("");
        console.log("Total Supply:", mdtToken.totalSupply() / 1e18, "MDT");
        console.log("========================================");
        
        // Check scaffold-eth keystore account
        address scaffoldAccount = 0x3538a544021c07869c16b764424c5987409cba48;
        uint256 scaffoldBalance = mdtToken.balanceOf(scaffoldAccount);
        if (scaffoldBalance > 0) {
            console.log("");
            console.log("[INFO] Scaffold-eth default account has:", scaffoldBalance / 1e18, "MDT");
            console.log("Address:", scaffoldAccount);
        }
    }
}
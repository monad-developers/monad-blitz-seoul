// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {MONCharacter} from "../src/MONCharacter.sol";
import {MONCharacterVault} from "../src/MONCharacterVault.sol";
import {MONColosseum} from "../src/MONColosseum.sol";

contract DeployMONStar is Script {
    MONCharacter public character;
    MONCharacterVault public vault;
    // MONColosseum 변수 추가
    MONColosseum public colosseum;
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        character = new MONCharacter();
        vault = new MONCharacterVault(address(character));
        colosseum = new MONColosseum(address(character), address(vault));
        vault.setColosseumAddress(address(colosseum));
        colosseum.setGameMaster(msg.sender);

        vm.stopBroadcast();
    }
}

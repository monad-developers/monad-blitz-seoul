// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MONCharacter.sol";
import "../src/MONCharacterVault.sol";

contract MONCharacterVaultTest is Test {
    MONCharacter character;
    MONCharacterVault vault;

    address user = address(0xAAA);
    address other = address(0xBEEF);

    function setUp() public {
        character = new MONCharacter();
        vault = new MONCharacterVault(address(character));

        vm.deal(user, 10 ether);
        vm.deal(other, 10 ether);
    }

    function testMintAndDepositAndWithdraw() public {
        vm.startPrank(user);
        character.mint("ipfs://test1.json");
        vault.deposit{value: 1 ether}();
        uint256 bal = vault.balanceOf(user);
        vm.stopPrank();

        assertEq(bal, 1 ether);

        vm.startPrank(user);
        uint256 before = user.balance;
        vault.withdraw(0.4 ether);
        uint256 afterVault = vault.balanceOf(user);
        vm.stopPrank();

        assertEq(afterVault, 0.6 ether);
        assertEq(user.balance, before + 0.4 ether);
    }

    function testWithdrawRevertIfInsufficient() public {
        vm.startPrank(user);
        character.mint("ipfs://test1.json");
        vault.deposit{value: 0.5 ether}();
        vm.expectRevert(bytes("Insufficient"));
        vault.withdraw(1 ether);
        vm.stopPrank();
    }
}

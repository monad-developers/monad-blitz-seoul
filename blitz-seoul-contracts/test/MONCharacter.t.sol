// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MONCharacter.sol";

contract MONCharacterTest is Test {
    MONCharacter mon;
    address user = address(0xABCD);

    function setUp() public {
        mon = new MONCharacter();
        vm.deal(user, 10 ether);
    }

    function testMintCharacter() public {
        vm.startPrank(user);
        uint256 tokenId = mon.mint("ipfs://test1.json");
        vm.stopPrank();

        assertEq(mon.ownerOf(tokenId), user);
        assertEq(mon.tokenURI(tokenId), "ipfs://test1.json");
        assertEq(mon.tokenIdOf(user), tokenId);
    }

    function testMintCharacterWithEmptyURI() public {
        vm.startPrank(user);
        vm.expectRevert(bytes("Empty uri"));
        mon.mint("");
        vm.stopPrank();
    }

    function testMintCharacterWithAlreadyHave() public {
        vm.startPrank(user);
        mon.mint("ipfs://test1.json");
        vm.expectRevert(bytes("Already have nft"));
        mon.mint("ipfs://test2.json");
        vm.stopPrank();
    }

    function testUpdateTokenURI() public {
        vm.startPrank(user);
        uint256 tokenId = mon.mint("ipfs://test1.json");
        mon.updateTokenURI("ipfs://test3.json");
        vm.stopPrank();
        assertEq(mon.ownerOf(tokenId), user);
        assertEq(mon.tokenURI(tokenId), "ipfs://test3.json");
    }
}

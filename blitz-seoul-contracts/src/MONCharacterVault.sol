// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IMONCharacter is IERC721 {
    function tokenIdOf(address owner) external view returns (uint256);
}

contract MONCharacterVault is Ownable, ReentrancyGuard {
    IMONCharacter public immutable monCharacter;

    mapping(uint256 => uint256) public balances;

    address public colosseum;

    modifier onlyColosseum() {
        require(msg.sender == colosseum, "Not Colosseum");
        _;
    }

    constructor(address character) Ownable(msg.sender) {
        require(character != address(0), "Invalid NFT addresss");
        monCharacter = IMONCharacter(character);
    }

    function setColosseumAddress(address _colosseum) external onlyOwner {
        require(_colosseum != address(0), "Invalid address");
        colosseum = _colosseum;
    }

    function deposit() external payable {
        require(msg.value > 0, "No value");
        uint256 tokenId = monCharacter.tokenIdOf(msg.sender);
        balances[tokenId] += msg.value;
    }

    function withdraw(uint256 amount) external nonReentrant {
        uint256 tokenId = monCharacter.tokenIdOf(msg.sender);
        require(balances[tokenId] >= amount, "Insufficient");
        balances[tokenId] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }

    function settle(
        uint256 winnerNftId,
        uint256 loserNftId,
        uint256 amount
    ) external onlyColosseum returns (uint256) {
        require(
            balances[loserNftId] >= amount,
            "Loser has insufficient funds for settlement"
        );

        balances[loserNftId] -= amount;
        balances[winnerNftId] += amount;

        return balances[loserNftId];
    }

    function balanceOf(address owner) external view returns (uint256 balance) {
        uint256 tokenId = monCharacter.tokenIdOf(owner);
        return balances[tokenId];
    }
}

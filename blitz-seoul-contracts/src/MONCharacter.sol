// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MONCharacter is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;
    mapping(address => uint256) public ownerToTokenId;
    mapping(address => bool) public hasMinted;

    constructor() ERC721("MON Character", "MONCH") Ownable(msg.sender) {}

    event MintCharacter(address indexed to, uint256 indexed tokenId);
    event UpdateCharacterURI(uint256 indexed tokenId, string newURI);

    function mint(
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        require(bytes(metadataURI).length != 0, "Empty uri"); //check empty uri
        require(!hasMinted[msg.sender], "Already have nft"); //check already minted
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        hasMinted[msg.sender] = true;
        ownerToTokenId[msg.sender] = tokenId;

        emit MintCharacter(msg.sender, tokenId);
    }

    function updateTokenURI(string calldata newURI) external {
        require(hasMinted[msg.sender], "Token is not exsisted");
        require(bytes(newURI).length != 0, "Empty uri");

        _setTokenURI(ownerToTokenId[msg.sender], newURI);

        emit UpdateCharacterURI(ownerToTokenId[msg.sender], newURI);
    }

    function tokenIdOf(address owner) external view returns (uint256) {
        return ownerToTokenId[owner];
    }
}

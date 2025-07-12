// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GameManager.sol";

contract MinerNFT is ERC721, ERC721Enumerable, Ownable {
    enum MinerType {
        EVEN_BLASTER, // EvenBlaster
        PRIME_SNIPER, // PrimeSniper
        BALANCED_SCAN, // BalancedScan
        PI_SNIPER, // PiSniper
        SQUARE_SEEKER // SquareSeeker
    }

    struct MinerStats {
        MinerType minerType;
        uint256 minRange;
        uint256 maxRange;
        GameManager.PatternType specialization;
        uint256 baseSuccessRate; // 성공률 (10000 = 100%)
        string name;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => MinerStats) public minerStats;

    // 채굴기별 설정 (PRD 기준)
    mapping(MinerType => MinerStats) public minerConfig;

    event MinerMinted(address indexed to, uint256 indexed tokenId, MinerType minerType, string name);

    constructor() ERC721("Monaminer NFT", "MINER") Ownable(msg.sender) {
        _initializeMinerConfigs();
    }

    function _initializeMinerConfigs() private {
        // EvenBlaster NFT
        minerConfig[MinerType.EVEN_BLASTER] = MinerStats({
            minerType: MinerType.EVEN_BLASTER,
            minRange: 40000,
            maxRange: 60000,
            specialization: GameManager.PatternType.EVEN,
            baseSuccessRate: 15, // 0.015%
            name: "EvenBlaster"
        });

        // PrimeSniper NFT
        minerConfig[MinerType.PRIME_SNIPER] = MinerStats({
            minerType: MinerType.PRIME_SNIPER,
            minRange: 74000,
            maxRange: 80000,
            specialization: GameManager.PatternType.PRIME,
            baseSuccessRate: 12, // 0.012%
            name: "PrimeSniper"
        });

        // BalancedScan NFT (범용)
        minerConfig[MinerType.BALANCED_SCAN] = MinerStats({
            minerType: MinerType.BALANCED_SCAN,
            minRange: 50000,
            maxRange: 70000,
            specialization: GameManager.PatternType.EVEN, // 모든 패턴에 대응
            baseSuccessRate: 8, // 0.008%
            name: "BalancedScan"
        });

        // PiSniper NFT
        minerConfig[MinerType.PI_SNIPER] = MinerStats({
            minerType: MinerType.PI_SNIPER,
            minRange: 60000,
            maxRange: 70000,
            specialization: GameManager.PatternType.PI,
            baseSuccessRate: 12, // 0.012%
            name: "PiSniper"
        });

        // SquareSeeker NFT
        minerConfig[MinerType.SQUARE_SEEKER] = MinerStats({
            minerType: MinerType.SQUARE_SEEKER,
            minRange: 30000,
            maxRange: 50000,
            specialization: GameManager.PatternType.SQUARE,
            baseSuccessRate: 14, // 0.014%
            name: "SquareSeeker"
        });
    }

    function mintMiner(address to, MinerType minerType) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        MinerStats memory config = minerConfig[minerType];
        minerStats[tokenId] = config;

        _safeMint(to, tokenId);

        emit MinerMinted(to, tokenId, minerType, config.name);

        return tokenId;
    }

    function batchMintMiners(
        address to,
        MinerType[] calldata minerTypes
    ) external onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](minerTypes.length);

        for (uint256 i = 0; i < minerTypes.length; i++) {
            uint256 tokenId = _nextTokenId++;

            MinerStats memory config = minerConfig[minerTypes[i]];
            minerStats[tokenId] = config;

            _safeMint(to, tokenId);

            emit MinerMinted(to, tokenId, minerTypes[i], config.name);
            tokenIds[i] = tokenId;
        }

        return tokenIds;
    }

    function getMinerStats(uint256 tokenId) external view returns (MinerStats memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return minerStats[tokenId];
    }

    function getOwnedMiners(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokens;
    }

    function getMinerTypeStats(MinerType minerType) external view returns (MinerStats memory) {
        return minerConfig[minerType];
    }

    function calculateEffectiveSuccessRate(
        uint256 tokenId,
        GameManager.PatternType currentPattern
    ) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        MinerStats memory stats = minerStats[tokenId];

        // BalancedScan은 모든 패턴에 동일한 성공률
        if (stats.minerType == MinerType.BALANCED_SCAN) {
            return stats.baseSuccessRate;
        }

        // 특화 패턴과 일치하면 기본 성공률, 아니면 절반
        if (stats.specialization == currentPattern) {
            return stats.baseSuccessRate;
        } else {
            return stats.baseSuccessRate / 2;
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        MinerStats memory stats = minerStats[tokenId];

        return
            string(
                abi.encodePacked(
                    "https://api.monaminer.com/nft/",
                    Strings.toString(uint256(stats.minerType)),
                    "/",
                    Strings.toString(tokenId)
                )
            );
    }

    // Override required functions
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

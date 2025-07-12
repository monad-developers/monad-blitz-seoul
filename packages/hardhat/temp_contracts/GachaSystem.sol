// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MinerNFT.sol";

contract GachaSystem is Ownable {
    MinerNFT public minerNFT;
    IERC20 public monToken;

    uint256 public constant GACHA_PRICE = 10 ether; // 10 MON
    uint256 public constant PACK_SIZE = 3; // 팩당 3개 NFT

    // 동일 확률 20%씩 (총 1000으로 normalize)
    uint256[5] public dropRates = [200, 200, 200, 200, 200];

    struct GachaPack {
        address buyer;
        uint256[3] tokenIds;
        MinerNFT.MinerType[3] minerTypes;
        uint256 timestamp;
    }

    mapping(address => GachaPack[]) public userPackHistory;
    uint256 public totalPacksSold;

    event GachaPackPurchased(
        address indexed buyer,
        uint256 indexed packId,
        uint256[3] tokenIds,
        MinerNFT.MinerType[3] minerTypes,
        uint256 price
    );

    event GachaConfigUpdated(uint256[5] newDropRates);

    constructor(address _minerNFT, address _monToken) Ownable(msg.sender) {
        minerNFT = MinerNFT(_minerNFT);
        monToken = IERC20(_monToken);
    }

    function purchaseGachaPack()
        external
        returns (uint256[3] memory tokenIds, MinerNFT.MinerType[3] memory minerTypes)
    {
        require(monToken.balanceOf(msg.sender) >= GACHA_PRICE, "Insufficient MON balance");
        require(monToken.transferFrom(msg.sender, address(this), GACHA_PRICE), "MON transfer failed");

        // 3개 NFT 랜덤 생성
        for (uint256 i = 0; i < PACK_SIZE; i++) {
            minerTypes[i] = _rollMinerType(i);
        }

        // NFT 민팅
        MinerNFT.MinerType[] memory minerTypeArray = new MinerNFT.MinerType[](3);
        for (uint256 i = 0; i < 3; i++) {
            minerTypeArray[i] = minerTypes[i];
        }
        uint256[] memory mintedTokens = minerNFT.batchMintMiners(msg.sender, minerTypeArray);
        for (uint256 i = 0; i < 3; i++) {
            tokenIds[i] = mintedTokens[i];
        }

        // 팩 기록 저장
        GachaPack memory pack = GachaPack({
            buyer: msg.sender,
            tokenIds: tokenIds,
            minerTypes: minerTypes,
            timestamp: block.timestamp
        });

        userPackHistory[msg.sender].push(pack);
        totalPacksSold++;

        emit GachaPackPurchased(msg.sender, totalPacksSold, tokenIds, minerTypes, GACHA_PRICE);

        return (tokenIds, minerTypes);
    }

    function _rollMinerType(uint256 seed) private view returns (MinerNFT.MinerType) {
        uint256 randomValue = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, seed, totalPacksSold))
        ) % 1000;

        uint256 cumulative = 0;
        for (uint256 i = 0; i < 5; i++) {
            cumulative += dropRates[i];
            if (randomValue < cumulative) {
                return MinerNFT.MinerType(i);
            }
        }

        // fallback (should never reach here)
        return MinerNFT.MinerType.BALANCED_SCAN;
    }

    function getUserPackHistory(address user) external view returns (GachaPack[] memory) {
        return userPackHistory[user];
    }

    function getUserPackCount(address user) external view returns (uint256) {
        return userPackHistory[user].length;
    }

    function getDropRates() external view returns (uint256[5] memory) {
        return dropRates;
    }

    function updateDropRates(uint256[5] calldata newDropRates) external onlyOwner {
        uint256 total = 0;
        for (uint256 i = 0; i < 5; i++) {
            total += newDropRates[i];
        }
        require(total == 1000, "Drop rates must sum to 1000");

        dropRates = newDropRates;
        emit GachaConfigUpdated(newDropRates);
    }

    function setMinerNFT(address _minerNFT) external onlyOwner {
        minerNFT = MinerNFT(_minerNFT);
    }

    function setMonToken(address _monToken) external onlyOwner {
        monToken = IERC20(_monToken);
    }

    function withdrawMON(address to, uint256 amount) external onlyOwner {
        require(monToken.transfer(to, amount), "MON transfer failed");
    }

    function withdrawAllMON(address to) external onlyOwner {
        uint256 balance = monToken.balanceOf(address(this));
        require(monToken.transfer(to, balance), "MON transfer failed");
    }

    function getContractStats()
        external
        view
        returns (uint256 totalPacks, uint256 totalRevenue, uint256 contractMONBalance)
    {
        return (totalPacksSold, totalPacksSold * GACHA_PRICE, monToken.balanceOf(address(this)));
    }

    function simulateGachaPack(uint256 seed) external view returns (MinerNFT.MinerType[3] memory) {
        MinerNFT.MinerType[3] memory simulated;

        for (uint256 i = 0; i < PACK_SIZE; i++) {
            uint256 randomValue = uint256(keccak256(abi.encodePacked(seed, i, block.timestamp))) % 1000;

            uint256 cumulative = 0;
            for (uint256 j = 0; j < 5; j++) {
                cumulative += dropRates[j];
                if (randomValue < cumulative) {
                    simulated[i] = MinerNFT.MinerType(j);
                    break;
                }
            }
        }

        return simulated;
    }
}

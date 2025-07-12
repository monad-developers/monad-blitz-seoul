// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RewardManager is Ownable, ReentrancyGuard {
    IERC20 public monToken;

    uint256 public constant BASIC_REWARD = 30 ether; // 30 MON per success
    uint256 public constant COMPLETION_BONUS = 500 ether; // 500 MON for completion
    uint256 public constant DEV_FEE_PERCENT = 10; // 10% dev fee

    address public devWallet;
    address public miningEngine;

    struct RewardStats {
        uint256 totalBasicRewards;
        uint256 totalCompletionBonuses;
        uint256 totalDevFees;
        uint256 totalDistributed;
    }

    mapping(address => uint256) public playerTotalEarned;
    mapping(address => uint256) public playerBasicRewards;
    mapping(address => uint256) public playerCompletionBonuses;

    RewardStats public rewardStats;

    event BasicRewardDistributed(address indexed player, uint256 amount, uint256 devFee, uint256 timestamp);

    event CompletionBonusDistributed(address indexed player, uint256 amount, uint256 timestamp);

    event DevFeeCollected(address indexed devWallet, uint256 amount, uint256 timestamp);

    modifier onlyMiningEngine() {
        require(msg.sender == miningEngine, "Only mining engine");
        _;
    }

    constructor(address _monToken, address _devWallet) Ownable(msg.sender) {
        monToken = IERC20(_monToken);
        devWallet = _devWallet;
    }

    function distributeBasicReward(address player) external onlyMiningEngine nonReentrant {
        require(player != address(0), "Invalid player address");

        uint256 devFee = (BASIC_REWARD * DEV_FEE_PERCENT) / 100;
        uint256 playerReward = BASIC_REWARD - devFee;

        // 플레이어에게 보상 지급
        require(monToken.transfer(player, playerReward), "Player reward transfer failed");

        // 개발팀에게 수수료 지급
        require(monToken.transfer(devWallet, devFee), "Dev fee transfer failed");

        // 통계 업데이트
        playerTotalEarned[player] += playerReward;
        playerBasicRewards[player] += playerReward;

        rewardStats.totalBasicRewards += playerReward;
        rewardStats.totalDevFees += devFee;
        rewardStats.totalDistributed += BASIC_REWARD;

        emit BasicRewardDistributed(player, playerReward, devFee, block.timestamp);
        emit DevFeeCollected(devWallet, devFee, block.timestamp);
    }

    function distributeCompletionBonus(address player) external onlyMiningEngine nonReentrant {
        require(player != address(0), "Invalid player address");

        // 완주 보너스는 개발팀 수수료 없이 전액 지급
        require(monToken.transfer(player, COMPLETION_BONUS), "Completion bonus transfer failed");

        // 통계 업데이트
        playerTotalEarned[player] += COMPLETION_BONUS;
        playerCompletionBonuses[player] += COMPLETION_BONUS;

        rewardStats.totalCompletionBonuses += COMPLETION_BONUS;
        rewardStats.totalDistributed += COMPLETION_BONUS;

        emit CompletionBonusDistributed(player, COMPLETION_BONUS, block.timestamp);
    }

    function batchDistributeRewards(address[] calldata players, uint256[] calldata amounts) external onlyOwner {
        require(players.length == amounts.length, "Arrays length mismatch");

        for (uint256 i = 0; i < players.length; i++) {
            require(monToken.transfer(players[i], amounts[i]), "Batch transfer failed");
            playerTotalEarned[players[i]] += amounts[i];
            rewardStats.totalDistributed += amounts[i];
        }
    }

    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(monToken.transfer(to, amount), "Emergency withdrawal failed");
    }

    function getPlayerStats(
        address player
    ) external view returns (uint256 totalEarned, uint256 basicRewards, uint256 completionBonuses) {
        return (playerTotalEarned[player], playerBasicRewards[player], playerCompletionBonuses[player]);
    }

    function getContractBalance() external view returns (uint256) {
        return monToken.balanceOf(address(this));
    }

    function simulateROI(
        uint256 investmentCost,
        uint256 expectedSuccesses,
        bool willComplete
    ) external pure returns (uint256 totalRevenue, uint256 netProfit, uint256 roiPercent) {
        uint256 completionBonusTotal = willComplete ? COMPLETION_BONUS : 0;

        totalRevenue =
            (expectedSuccesses * (BASIC_REWARD - (BASIC_REWARD * DEV_FEE_PERCENT) / 100)) +
            completionBonusTotal;

        if (totalRevenue >= investmentCost) {
            netProfit = totalRevenue - investmentCost;
            roiPercent = (netProfit * 100) / investmentCost;
        } else {
            netProfit = 0;
            roiPercent = 0;
        }

        return (totalRevenue, netProfit, roiPercent);
    }

    function calculateRevenueProjection(
        uint256 successCount,
        bool completedMining
    ) external pure returns (uint256 totalPlayerReward, uint256 totalDevFee, uint256 totalCost) {
        uint256 basicRewardTotal = successCount * BASIC_REWARD;
        uint256 completionBonusTotal = completedMining ? COMPLETION_BONUS : 0;

        totalPlayerReward =
            (successCount * (BASIC_REWARD - (BASIC_REWARD * DEV_FEE_PERCENT) / 100)) +
            completionBonusTotal;
        totalDevFee = (successCount * (BASIC_REWARD * DEV_FEE_PERCENT)) / 100;
        totalCost = basicRewardTotal + completionBonusTotal;

        return (totalPlayerReward, totalDevFee, totalCost);
    }

    // Admin functions
    function setMonToken(address _monToken) external onlyOwner {
        monToken = IERC20(_monToken);
    }

    function setDevWallet(address _devWallet) external onlyOwner {
        devWallet = _devWallet;
    }

    function setMiningEngine(address _miningEngine) external onlyOwner {
        miningEngine = _miningEngine;
    }

    function fundContract(uint256 amount) external onlyOwner {
        require(monToken.transferFrom(msg.sender, address(this), amount), "Funding failed");
    }

    function getDetailedStats()
        external
        view
        returns (RewardStats memory stats, uint256 contractBalance, uint256 totalPlayers)
    {
        return (
            rewardStats,
            monToken.balanceOf(address(this)),
            0 // totalPlayers는 별도 카운터 필요
        );
    }
}

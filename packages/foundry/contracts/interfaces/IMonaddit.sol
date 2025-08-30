// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStakingVault {
    function reserveForContent(address user, bytes32 contentId, uint256 amount) external;
    function releaseContentBond(address user, bytes32 contentId) external;
    function slashContentBond(address user, bytes32 contentId, uint256 amount, address recipient) external returns (uint256);
    function slashForJury(address user, bytes32 contentId, uint256 juryAmount, address[] calldata jurors) external;
    function userStakes(address user) external view returns (uint256);
    function isEligibleStaker(address user) external view returns (bool);
    function getStakeInfo(address user) external view returns (
        uint256 totalAmount,
        uint256 available,
        uint256 locked,
        uint256 stakedAt,
        uint256 stakeAge
    );
}

interface IReputationSBT {
    function hasSBT(address user) external view returns (bool);
    function updateKarma(address user, int256 change, string calldata reason) external;
    function recordDispute(address user, bool won) external;
    function recordChallenge(address user, bool successful) external;
    function recordContentCreated(address user) external;
    function getReputationMultiplier(address user) external view returns (uint256);
    function isGoodStanding(address user) external view returns (bool);
    function getReputation(address user) external view returns (uint256 karma, uint256 disputeRate);
}

interface IContentRegistry {
    function resolve(uint256 contentId, bool guilty, uint256 slashAmount) external;
}

interface IModerationGame {
    function createDispute(uint256 contentId, address challenger, uint256 challengeBond) external returns (uint256);
    function initializeDispute(uint256 contentId, address challenger, uint256 challengerBond) external;
}

interface IStakingRewards {
    function accrue(uint256 amount) external;
}
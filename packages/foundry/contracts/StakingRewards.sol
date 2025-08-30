// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMonaddit.sol";

contract StakingRewards is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant ACCRUER_ROLE = keccak256("ACCRUER_ROLE");

    IERC20 public immutable mdtToken;
    IStakingVault public immutable stakingVault;
    IReputationSBT public reputationSBT;

    uint256 public constant EPOCH_DURATION = 7 days;
    uint256 public constant MIN_DISTRIBUTION = 1 * 10 ** 18; // 1 MDT minimum

    struct Epoch {
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewards;
        uint256 totalShares;
        bool finalized;
        mapping(address => uint256) userShares;
        mapping(address => bool) claimed;
    }

    struct UserInfo {
        uint256 lastClaimedEpoch;
        uint256 totalClaimed;
        uint256 pendingRewards;
    }

    uint256 public currentEpoch;
    uint256 public accumulatedRewards;
    uint256 public lastEpochTime;
    
    mapping(uint256 => Epoch) public epochs;
    mapping(address => UserInfo) public userInfo;
    address[] public eligibleUsers;

    event RewardsAccrued(uint256 amount, uint256 totalAccumulated);
    event EpochFinalized(uint256 indexed epochId, uint256 totalRewards, uint256 totalShares);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 epochId);
    event UserRegistered(address indexed user, uint256 shares);

    constructor(address _mdtToken, address _stakingVault) {
        mdtToken = IERC20(_mdtToken);
        stakingVault = IStakingVault(_stakingVault);
        lastEpochTime = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
    }

    function setReputationSBT(address _reputationSBT) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationSBT = IReputationSBT(_reputationSBT);
    }

    function accrue(uint256 amount) external onlyRole(ACCRUER_ROLE) {
        require(amount > 0, "Amount must be > 0");
        
        mdtToken.safeTransferFrom(msg.sender, address(this), amount);
        accumulatedRewards += amount;
        
        emit RewardsAccrued(amount, accumulatedRewards);
    }

    function checkpoint() external {
        require(block.timestamp >= lastEpochTime + EPOCH_DURATION, "Epoch not ready");
        require(accumulatedRewards >= MIN_DISTRIBUTION, "Insufficient rewards");
        
        _finalizeEpoch();
    }

    function _finalizeEpoch() private {
        uint256 epochId = currentEpoch;
        Epoch storage epoch = epochs[epochId];
        
        epoch.startTime = lastEpochTime;
        epoch.endTime = block.timestamp;
        epoch.totalRewards = accumulatedRewards;
        
        // Calculate shares for all eligible users
        uint256 totalShares = 0;
        delete eligibleUsers; // Clear previous eligible users
        
        // Scan through registered stakers (simplified - in production, maintain a registry)
        // For demo, we'll process a limited set of users
        address[] memory potentialUsers = _getPotentialUsers();
        
        for (uint i = 0; i < potentialUsers.length; i++) {
            address user = potentialUsers[i];
            if (isEligible(user)) {
                uint256 userShares = _calculateUserShares(user);
                if (userShares > 0) {
                    epoch.userShares[user] = userShares;
                    totalShares += userShares;
                    eligibleUsers.push(user);
                    
                    emit UserRegistered(user, userShares);
                }
            }
        }
        
        epoch.totalShares = totalShares;
        epoch.finalized = true;
        
        emit EpochFinalized(epochId, epoch.totalRewards, totalShares);
        
        // Reset for next epoch
        currentEpoch++;
        lastEpochTime = block.timestamp;
        accumulatedRewards = 0;
    }

    function claim() external nonReentrant returns (uint256 totalClaimed) {
        address user = msg.sender;
        UserInfo storage info = userInfo[user];
        
        totalClaimed = 0;
        
        // Claim from all unclaimed epochs
        for (uint256 epochId = info.lastClaimedEpoch; epochId < currentEpoch; epochId++) {
            Epoch storage epoch = epochs[epochId];
            
            if (!epoch.finalized || epoch.claimed[user]) continue;
            
            uint256 userShares = epoch.userShares[user];
            if (userShares == 0) continue;
            
            uint256 reward = (epoch.totalRewards * userShares) / epoch.totalShares;
            if (reward > 0) {
                epoch.claimed[user] = true;
                totalClaimed += reward;
                
                emit RewardsClaimed(user, reward, epochId);
            }
        }
        
        if (totalClaimed > 0) {
            info.lastClaimedEpoch = currentEpoch;
            info.totalClaimed += totalClaimed;
            
            mdtToken.safeTransfer(user, totalClaimed);
        }
        
        return totalClaimed;
    }

    function isEligible(address user) public view returns (bool) {
        // Check staking vault eligibility
        if (!stakingVault.isEligibleStaker(user)) return false;
        
        // Check reputation if SBT is set
        if (address(reputationSBT) != address(0)) {
            if (!reputationSBT.isGoodStanding(user)) return false;
        }
        
        return true;
    }

    function _calculateUserShares(address user) private view returns (uint256) {
        (uint256 stakeAmount, , , , ) = stakingVault.getStakeInfo(user);
        
        if (stakeAmount == 0) return 0;
        
        uint256 multiplier = 100; // Base 1.0x
        if (address(reputationSBT) != address(0)) {
            multiplier = reputationSBT.getReputationMultiplier(user);
        }
        
        return (stakeAmount * multiplier) / 100;
    }

    function _getPotentialUsers() private view returns (address[] memory) {
        // In production, maintain a proper registry
        // For now, return empty array - users must be tracked elsewhere
        address[] memory users = new address[](0);
        return users;
    }

    function getEpochInfo(uint256 epochId) external view returns (
        uint256 startTime,
        uint256 endTime,
        uint256 totalRewards,
        uint256 totalShares,
        bool finalized
    ) {
        Epoch storage epoch = epochs[epochId];
        return (
            epoch.startTime,
            epoch.endTime,
            epoch.totalRewards,
            epoch.totalShares,
            epoch.finalized
        );
    }

    function getUserEpochInfo(address user, uint256 epochId) external view returns (
        uint256 shares,
        bool claimed,
        uint256 reward
    ) {
        Epoch storage epoch = epochs[epochId];
        shares = epoch.userShares[user];
        claimed = epoch.claimed[user];
        
        if (shares > 0 && epoch.totalShares > 0) {
            reward = (epoch.totalRewards * shares) / epoch.totalShares;
        } else {
            reward = 0;
        }
    }

    function getPendingRewards(address user) external view returns (uint256 pending) {
        UserInfo memory info = userInfo[user];
        pending = 0;
        
        for (uint256 epochId = info.lastClaimedEpoch; epochId < currentEpoch; epochId++) {
            Epoch storage epoch = epochs[epochId];
            
            if (!epoch.finalized || epoch.claimed[user]) continue;
            
            uint256 userShares = epoch.userShares[user];
            if (userShares > 0 && epoch.totalShares > 0) {
                pending += (epoch.totalRewards * userShares) / epoch.totalShares;
            }
        }
        
        return pending;
    }
}
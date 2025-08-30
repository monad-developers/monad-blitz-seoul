// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakingVault is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");
    bytes32 public constant CONTENT_REGISTRY_ROLE = keccak256("CONTENT_REGISTRY_ROLE");

    IERC20 public immutable mdtToken;
    uint256 public constant MINIMUM_STAKE = 10 * 10 ** 18; // 10 MDT
    uint256 public constant MAX_SLASHING_PERCENT = 20; // 20% max per incident

    struct UserStake {
        uint256 amount;
        uint256 locked;
        uint256 stakedAt;
        uint256 lastSlashedAt;
    }

    mapping(address => UserStake) public userStakes;
    mapping(bytes32 => uint256) public contentBonds;
    mapping(address => mapping(bytes32 => uint256)) public userContentBonds;

    uint256 public totalStaked;
    uint256 public totalLocked;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event BondReserved(address indexed user, bytes32 indexed contentId, uint256 amount);
    event BondReleased(address indexed user, bytes32 indexed contentId, uint256 amount);
    event Slashed(address indexed user, uint256 amount, string reason);

    constructor(address _mdtToken) {
        mdtToken = IERC20(_mdtToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        mdtToken.safeTransferFrom(msg.sender, address(this), amount);
        
        UserStake storage stake = userStakes[msg.sender];
        if (stake.stakedAt == 0) {
            stake.stakedAt = block.timestamp;
        }
        stake.amount += amount;
        totalStaked += amount;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        UserStake storage stake = userStakes[msg.sender];
        uint256 available = stake.amount - stake.locked;
        
        require(amount > 0, "Amount must be > 0");
        require(amount <= available, "Insufficient available balance");
        require(stake.amount - amount >= MINIMUM_STAKE || stake.amount - amount == 0, "Would go below minimum stake");

        stake.amount -= amount;
        totalStaked -= amount;

        if (stake.amount == 0) {
            stake.stakedAt = 0;
            stake.lastSlashedAt = 0;
        }

        mdtToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function reserveForContent(address user, bytes32 contentId, uint256 amount) 
        external 
        onlyRole(CONTENT_REGISTRY_ROLE) 
    {
        UserStake storage stake = userStakes[user];
        require(stake.amount - stake.locked >= amount, "Insufficient available stake");

        stake.locked += amount;
        totalLocked += amount;
        contentBonds[contentId] = amount;
        userContentBonds[user][contentId] = amount;

        emit BondReserved(user, contentId, amount);
    }

    function releaseContentBond(address user, bytes32 contentId) 
        external 
        onlyRole(CONTENT_REGISTRY_ROLE) 
    {
        uint256 amount = userContentBonds[user][contentId];
        require(amount > 0, "No bond found");

        UserStake storage stake = userStakes[user];
        stake.locked -= amount;
        totalLocked -= amount;
        
        delete contentBonds[contentId];
        delete userContentBonds[user][contentId];

        emit BondReleased(user, contentId, amount);
    }

    function slash(address user, uint256 amount, string calldata reason) 
        external 
        onlyRole(SLASHER_ROLE) 
        returns (uint256 slashedAmount)
    {
        UserStake storage stake = userStakes[user];
        require(stake.amount > 0, "No stake to slash");

        uint256 maxSlash = (stake.amount * MAX_SLASHING_PERCENT) / 100;
        slashedAmount = amount > maxSlash ? maxSlash : amount;

        if (slashedAmount > stake.amount) {
            slashedAmount = stake.amount;
        }

        stake.amount -= slashedAmount;
        if (stake.locked > stake.amount) {
            stake.locked = stake.amount;
        }
        stake.lastSlashedAt = block.timestamp;
        totalStaked -= slashedAmount;

        emit Slashed(user, slashedAmount, reason);

        return slashedAmount;
    }

    function slashContentBond(address user, bytes32 contentId, uint256 amount, address recipient)
        external
        onlyRole(SLASHER_ROLE)
        returns (uint256 slashedAmount)
    {
        uint256 bondAmount = userContentBonds[user][contentId];
        require(bondAmount > 0, "No bond found");

        slashedAmount = amount > bondAmount ? bondAmount : amount;
        
        UserStake storage stake = userStakes[user];
        stake.amount -= slashedAmount;
        stake.locked -= bondAmount;
        totalStaked -= slashedAmount;
        totalLocked -= bondAmount;

        delete contentBonds[contentId];
        delete userContentBonds[user][contentId];

        if (recipient != address(0)) {
            mdtToken.safeTransfer(recipient, slashedAmount);
        }

        emit Slashed(user, slashedAmount, "Content bond slashed");

        return slashedAmount;
    }

    function getStakeInfo(address user) external view returns (
        uint256 totalAmount,
        uint256 available,
        uint256 locked,
        uint256 stakedAt,
        uint256 stakeAge
    ) {
        UserStake memory stake = userStakes[user];
        totalAmount = stake.amount;
        locked = stake.locked;
        available = totalAmount - locked;
        stakedAt = stake.stakedAt;
        stakeAge = stake.stakedAt > 0 ? block.timestamp - stake.stakedAt : 0;
    }

    function isEligibleStaker(address user) external view returns (bool) {
        UserStake memory stake = userStakes[user];
        if (stake.amount < MINIMUM_STAKE) return false;
        if (block.timestamp - stake.stakedAt < 7 days) return false;
        if (stake.lastSlashedAt > 0 && block.timestamp - stake.lastSlashedAt < 14 days) return false;
        return true;
    }
}
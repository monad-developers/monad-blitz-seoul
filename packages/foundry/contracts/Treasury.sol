// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Treasury is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    IERC20 public immutable mdtToken;

    uint256 public totalReceived;
    uint256 public totalDistributed;
    uint256 public communityFund;
    uint256 public bountyPool;

    struct Distribution {
        address recipient;
        uint256 amount;
        string reason;
        uint256 timestamp;
    }

    struct Bounty {
        string description;
        uint256 reward;
        address claimant;
        bool claimed;
        uint256 createdAt;
        uint256 claimedAt;
    }

    Distribution[] public distributions;
    Bounty[] public bounties;

    mapping(address => uint256) public recipientTotals;
    mapping(address => uint256) public bountyClaimantTotals;

    event FundsReceived(address indexed from, uint256 amount, string reason);
    event FundsDistributed(address indexed to, uint256 amount, string reason);
    event BountyCreated(uint256 indexed bountyId, string description, uint256 reward);
    event BountyClaimed(uint256 indexed bountyId, address indexed claimant);
    event CommunityFundAllocated(uint256 amount);

    constructor(address _mdtToken) {
        mdtToken = IERC20(_mdtToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
    }

    function receiveFunds(uint256 amount, string calldata reason) external {
        require(amount > 0, "Amount must be > 0");
        
        mdtToken.safeTransferFrom(msg.sender, address(this), amount);
        
        totalReceived += amount;
        communityFund += amount;
        
        emit FundsReceived(msg.sender, amount, reason);
    }

    function allocateToBountyPool(uint256 amount) external onlyRole(TREASURER_ROLE) {
        require(amount <= communityFund, "Insufficient community funds");
        
        communityFund -= amount;
        bountyPool += amount;
        
        emit CommunityFundAllocated(amount);
    }

    function distribute(address recipient, uint256 amount, string calldata reason) 
        external 
        onlyRole(DISTRIBUTOR_ROLE)
        nonReentrant 
    {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(amount <= communityFund, "Insufficient funds");
        
        communityFund -= amount;
        totalDistributed += amount;
        recipientTotals[recipient] += amount;
        
        distributions.push(Distribution({
            recipient: recipient,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp
        }));
        
        mdtToken.safeTransfer(recipient, amount);
        
        emit FundsDistributed(recipient, amount, reason);
    }

    function createBounty(string calldata description, uint256 reward) 
        external 
        onlyRole(TREASURER_ROLE)
        returns (uint256 bountyId)
    {
        require(reward > 0, "Reward must be > 0");
        require(reward <= bountyPool, "Insufficient bounty pool");
        
        bountyPool -= reward;
        
        bountyId = bounties.length;
        bounties.push(Bounty({
            description: description,
            reward: reward,
            claimant: address(0),
            claimed: false,
            createdAt: block.timestamp,
            claimedAt: 0
        }));
        
        emit BountyCreated(bountyId, description, reward);
    }

    function claimBounty(uint256 bountyId, address claimant) 
        external 
        onlyRole(TREASURER_ROLE)
        nonReentrant
    {
        require(bountyId < bounties.length, "Invalid bounty ID");
        
        Bounty storage bounty = bounties[bountyId];
        require(!bounty.claimed, "Bounty already claimed");
        require(claimant != address(0), "Invalid claimant");
        
        bounty.claimed = true;
        bounty.claimant = claimant;
        bounty.claimedAt = block.timestamp;
        
        totalDistributed += bounty.reward;
        bountyClaimantTotals[claimant] += bounty.reward;
        
        mdtToken.safeTransfer(claimant, bounty.reward);
        
        emit BountyClaimed(bountyId, claimant);
    }

    function withdrawEmergency(address token, address to, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(to != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            // Withdraw native token
            payable(to).transfer(amount);
        } else {
            // Withdraw ERC20 token
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function getTreasuryBalance() external view returns (uint256) {
        return mdtToken.balanceOf(address(this));
    }

    function getFundAllocation() external view returns (
        uint256 total,
        uint256 community,
        uint256 bounty,
        uint256 distributed
    ) {
        total = mdtToken.balanceOf(address(this));
        community = communityFund;
        bounty = bountyPool;
        distributed = totalDistributed;
    }

    function getDistributionHistory(uint256 offset, uint256 limit) 
        external 
        view 
        returns (Distribution[] memory) 
    {
        require(offset < distributions.length || distributions.length == 0, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > distributions.length) {
            end = distributions.length;
        }
        
        uint256 length = end - offset;
        Distribution[] memory result = new Distribution[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = distributions[offset + i];
        }
        
        return result;
    }

    function getBountyInfo(uint256 bountyId) external view returns (
        string memory description,
        uint256 reward,
        address claimant,
        bool claimed,
        uint256 createdAt,
        uint256 claimedAt
    ) {
        require(bountyId < bounties.length, "Invalid bounty ID");
        
        Bounty memory bounty = bounties[bountyId];
        return (
            bounty.description,
            bounty.reward,
            bounty.claimant,
            bounty.claimed,
            bounty.createdAt,
            bounty.claimedAt
        );
    }

    function getActiveBounties() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active bounties
        for (uint256 i = 0; i < bounties.length; i++) {
            if (!bounties[i].claimed) {
                activeCount++;
            }
        }
        
        // Collect active bounty IDs
        uint256[] memory activeBountyIds = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < bounties.length; i++) {
            if (!bounties[i].claimed) {
                activeBountyIds[index] = i;
                index++;
            }
        }
        
        return activeBountyIds;
    }

    receive() external payable {
        // Accept native token deposits
    }
}
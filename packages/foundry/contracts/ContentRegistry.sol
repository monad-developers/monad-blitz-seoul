// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMonaddit.sol";

contract ContentRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    IStakingVault public immutable stakingVault;
    IModerationGame public moderationGame;
    IStakingRewards public stakingRewards;
    address public treasury;

    uint256 public constant CONTENT_BOND = 0.1 * 10 ** 18; // 0.1 MDT
    uint256 public constant CHALLENGE_BOND = 0.2 * 10 ** 18; // 0.2 MDT
    uint256 public constant CHALLENGE_WINDOW = 7 days;
    uint256 public constant MAX_LOCK_PERIOD = 14 days;
    uint256 public constant RECHALLENGE_COOLDOWN = 5 days;

    enum ContentStatus {
        Published,
        Challenged,
        Disputed,
        Resolved
    }

    enum ChallengeReason {
        Spam,
        Harassment,
        Misinformation,
        IllegalContent,
        Other
    }

    struct Content {
        address author;
        bytes32 contentHash;
        string uri;
        uint256 bond;
        uint256 publishedAt;
        uint256 lockUntil;
        ContentStatus status;
        uint256 lastChallengedAt;
    }

    struct Challenge {
        address challenger;
        uint256 bond;
        ChallengeReason reason;
        string evidence;
        uint256 createdAt;
        bool resolved;
    }

    uint256 public nextContentId;
    mapping(uint256 => Content) public contents;
    mapping(uint256 => Challenge[]) public contentChallenges;
    mapping(bytes32 => uint256) public hashToContentId;

    event ContentPublished(uint256 indexed contentId, address indexed author, bytes32 contentHash);
    event ContentChallenged(uint256 indexed contentId, address indexed challenger, ChallengeReason reason);
    event ChallengeResolved(uint256 indexed contentId, bool guilty, uint256 slashedAmount);
    event BondWithdrawn(uint256 indexed contentId, address indexed author, uint256 amount);

    constructor(address _stakingVault) {
        stakingVault = IStakingVault(_stakingVault);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setContracts(address _moderationGame, address _stakingRewards, address _treasury) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        moderationGame = IModerationGame(_moderationGame);
        stakingRewards = IStakingRewards(_stakingRewards);
        treasury = _treasury;
    }

    function publish(bytes32 contentHash, string calldata uri) 
        external 
        nonReentrant 
        returns (uint256 contentId) 
    {
        require(contentHash != bytes32(0), "Invalid content hash");
        require(hashToContentId[contentHash] == 0, "Content already exists");

        contentId = nextContentId++;
        bytes32 internalContentId = keccak256(abi.encodePacked(contentId));

        stakingVault.reserveForContent(msg.sender, internalContentId, CONTENT_BOND);

        contents[contentId] = Content({
            author: msg.sender,
            contentHash: contentHash,
            uri: uri,
            bond: CONTENT_BOND,
            publishedAt: block.timestamp,
            lockUntil: block.timestamp + CHALLENGE_WINDOW,
            status: ContentStatus.Published,
            lastChallengedAt: 0
        });

        hashToContentId[contentHash] = contentId;

        emit ContentPublished(contentId, msg.sender, contentHash);
    }

    function challenge(uint256 contentId, ChallengeReason reason, string calldata evidence) 
        external 
        nonReentrant 
    {
        Content storage content = contents[contentId];
        require(content.author != address(0), "Content does not exist");
        require(content.status == ContentStatus.Published, "Content not challengeable");
        require(block.timestamp <= content.publishedAt + CHALLENGE_WINDOW, "Challenge window expired");
        require(
            content.lastChallengedAt == 0 || 
            block.timestamp >= content.lastChallengedAt + RECHALLENGE_COOLDOWN,
            "Rechallenge cooldown active"
        );

        bytes32 internalChallengeId = keccak256(abi.encodePacked(contentId, msg.sender, block.timestamp));
        stakingVault.reserveForContent(msg.sender, internalChallengeId, CHALLENGE_BOND);

        contentChallenges[contentId].push(Challenge({
            challenger: msg.sender,
            bond: CHALLENGE_BOND,
            reason: reason,
            evidence: evidence,
            createdAt: block.timestamp,
            resolved: false
        }));

        content.status = ContentStatus.Challenged;
        content.lockUntil = block.timestamp + MAX_LOCK_PERIOD;
        content.lastChallengedAt = block.timestamp;

        emit ContentChallenged(contentId, msg.sender, reason);

        if (address(moderationGame) != address(0)) {
            moderationGame.initializeDispute(contentId, msg.sender, CHALLENGE_BOND);
        }
    }

    function resolve(uint256 contentId, bool guilty) 
        external 
        onlyRole(RESOLVER_ROLE) 
        nonReentrant 
    {
        Content storage content = contents[contentId];
        require(content.status == ContentStatus.Challenged || content.status == ContentStatus.Disputed, "Invalid status");

        content.status = ContentStatus.Resolved;
        
        Challenge[] storage challenges = contentChallenges[contentId];
        require(challenges.length > 0, "No challenges found");

        bytes32 internalContentId = keccak256(abi.encodePacked(contentId));
        
        if (guilty) {
            // Slash content author's bond
            uint256 slashedAmount = stakingVault.slashContentBond(
                content.author, 
                internalContentId, 
                content.bond,
                address(this)
            );

            // Distribute slashed amount: 40% challenger, 30% jury, 20% staking rewards, 10% burn
            uint256 challengerReward = (slashedAmount * 40) / 100;
            uint256 juryReward = (slashedAmount * 30) / 100;
            uint256 stakingReward = (slashedAmount * 20) / 100;
            // Remaining 10% stays in contract (effectively burned or sent to treasury)

            // Release and reward challenger
            for (uint i = 0; i < challenges.length; i++) {
                if (!challenges[i].resolved) {
                    bytes32 challengeId = keccak256(abi.encodePacked(contentId, challenges[i].challenger, challenges[i].createdAt));
                    stakingVault.releaseContentBond(challenges[i].challenger, challengeId);
                    challenges[i].resolved = true;
                    // Transfer challenger reward (simplified - should split if multiple challengers)
                    if (challengerReward > 0) {
                        // Transfer logic here
                    }
                    break;
                }
            }

            // Send to staking rewards pool
            if (address(stakingRewards) != address(0) && stakingReward > 0) {
                stakingRewards.accrue(stakingReward);
            }

            emit ChallengeResolved(contentId, true, slashedAmount);
        } else {
            // Release content bond back to author
            stakingVault.releaseContentBond(content.author, internalContentId);
            
            // Slash challenger bonds
            for (uint i = 0; i < challenges.length; i++) {
                if (!challenges[i].resolved) {
                    bytes32 challengeId = keccak256(abi.encodePacked(contentId, challenges[i].challenger, challenges[i].createdAt));
                    stakingVault.slashContentBond(
                        challenges[i].challenger,
                        challengeId,
                        challenges[i].bond,
                        content.author
                    );
                    challenges[i].resolved = true;
                }
            }

            content.lockUntil = block.timestamp; // Allow immediate withdrawal
            
            emit ChallengeResolved(contentId, false, 0);
        }
    }

    function withdrawBond(uint256 contentId) external nonReentrant {
        Content storage content = contents[contentId];
        require(content.author == msg.sender, "Not content author");
        require(content.status == ContentStatus.Published, "Invalid status");
        require(block.timestamp > content.lockUntil, "Still in challenge window");

        bytes32 internalContentId = keccak256(abi.encodePacked(contentId));
        stakingVault.releaseContentBond(msg.sender, internalContentId);
        
        content.bond = 0;
        
        emit BondWithdrawn(contentId, msg.sender, CONTENT_BOND);
    }

    function getContent(uint256 contentId) external view returns (
        address author,
        bytes32 contentHash,
        string memory uri,
        uint256 bond,
        uint256 publishedAt,
        uint256 lockUntil,
        ContentStatus status
    ) {
        Content memory content = contents[contentId];
        return (
            content.author,
            content.contentHash,
            content.uri,
            content.bond,
            content.publishedAt,
            content.lockUntil,
            content.status
        );
    }

    function getChallenges(uint256 contentId) external view returns (Challenge[] memory) {
        return contentChallenges[contentId];
    }

    function canWithdrawBond(uint256 contentId) external view returns (bool) {
        Content memory content = contents[contentId];
        return content.status == ContentStatus.Published && 
               block.timestamp > content.lockUntil &&
               content.bond > 0;
    }
}
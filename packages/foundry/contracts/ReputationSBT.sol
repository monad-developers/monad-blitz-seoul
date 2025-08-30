// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationSBT is ERC721, AccessControl {
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _tokenIdCounter;

    struct Reputation {
        uint256 karma;
        uint256 totalDisputes;
        uint256 disputesWon;
        uint256 disputesLost;
        uint256 contentCreated;
        uint256 successfulChallenges;
        uint256 failedChallenges;
        uint256 lastActivityAt;
        uint256 joinedAt;
    }

    mapping(address => uint256) public userTokenId;
    mapping(uint256 => Reputation) public reputations;
    mapping(address => bool) public hasSBT;

    event ReputationUpdated(address indexed user, uint256 karma, uint256 disputeRate);
    event SBTMinted(address indexed user, uint256 tokenId);
    event KarmaChanged(address indexed user, int256 change, string reason);

    constructor() ERC721("Monaddit Reputation", "MDTREP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(!hasSBT[to], "Already has SBT");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(to, tokenId);
        
        userTokenId[to] = tokenId;
        hasSBT[to] = true;
        
        reputations[tokenId] = Reputation({
            karma: 100, // Starting karma
            totalDisputes: 0,
            disputesWon: 0,
            disputesLost: 0,
            contentCreated: 0,
            successfulChallenges: 0,
            failedChallenges: 0,
            lastActivityAt: block.timestamp,
            joinedAt: block.timestamp
        });

        emit SBTMinted(to, tokenId);
        
        return tokenId;
    }

    function updateKarma(address user, int256 change, string calldata reason) 
        external 
        onlyRole(UPDATER_ROLE) 
    {
        require(hasSBT[user], "User has no SBT");
        
        uint256 tokenId = userTokenId[user];
        Reputation storage rep = reputations[tokenId];
        
        if (change < 0) {
            uint256 absChange = uint256(-change);
            if (absChange > rep.karma) {
                rep.karma = 0;
            } else {
                rep.karma -= absChange;
            }
        } else {
            rep.karma += uint256(change);
        }
        
        rep.lastActivityAt = block.timestamp;
        
        emit KarmaChanged(user, change, reason);
        emit ReputationUpdated(user, rep.karma, _calculateDisputeRate(tokenId));
    }

    function recordContentCreated(address user) external onlyRole(UPDATER_ROLE) {
        require(hasSBT[user], "User has no SBT");
        
        uint256 tokenId = userTokenId[user];
        reputations[tokenId].contentCreated++;
        reputations[tokenId].lastActivityAt = block.timestamp;
    }

    function recordDispute(address user, bool won) external onlyRole(UPDATER_ROLE) {
        require(hasSBT[user], "User has no SBT");
        
        uint256 tokenId = userTokenId[user];
        Reputation storage rep = reputations[tokenId];
        
        rep.totalDisputes++;
        if (won) {
            rep.disputesWon++;
            rep.karma += 10; // Bonus for winning
        } else {
            rep.disputesLost++;
            if (rep.karma >= 20) {
                rep.karma -= 20; // Penalty for losing
            } else {
                rep.karma = 0;
            }
        }
        
        rep.lastActivityAt = block.timestamp;
        
        emit ReputationUpdated(user, rep.karma, _calculateDisputeRate(tokenId));
    }

    function recordChallenge(address user, bool successful) external onlyRole(UPDATER_ROLE) {
        require(hasSBT[user], "User has no SBT");
        
        uint256 tokenId = userTokenId[user];
        Reputation storage rep = reputations[tokenId];
        
        if (successful) {
            rep.successfulChallenges++;
            rep.karma += 5; // Small bonus for successful challenge
        } else {
            rep.failedChallenges++;
            if (rep.karma >= 10) {
                rep.karma -= 10; // Penalty for false challenge
            } else {
                rep.karma = 0;
            }
        }
        
        rep.lastActivityAt = block.timestamp;
        
        emit ReputationUpdated(user, rep.karma, _calculateDisputeRate(tokenId));
    }

    function getReputation(address user) external view returns (uint256 karma, uint256 disputeRate) {
        require(hasSBT[user], "User has no SBT");
        
        uint256 tokenId = userTokenId[user];
        karma = reputations[tokenId].karma;
        disputeRate = _calculateDisputeRate(tokenId);
    }

    function getFullReputation(address user) external view returns (Reputation memory) {
        require(hasSBT[user], "User has no SBT");
        return reputations[userTokenId[user]];
    }

    function getReputationMultiplier(address user) external view returns (uint256) {
        if (!hasSBT[user]) return 100; // Base multiplier 1.0 (100/100)
        
        uint256 tokenId = userTokenId[user];
        uint256 karma = reputations[tokenId].karma;
        
        // Karma-based multiplier: 0.5x to 2.0x
        if (karma < 50) return 50; // 0.5x
        if (karma < 100) return 75; // 0.75x
        if (karma < 200) return 100; // 1.0x
        if (karma < 500) return 125; // 1.25x
        if (karma < 1000) return 150; // 1.5x
        return 200; // 2.0x for high karma users
    }

    function isGoodStanding(address user) external view returns (bool) {
        if (!hasSBT[user]) return false;
        
        uint256 tokenId = userTokenId[user];
        Reputation memory rep = reputations[tokenId];
        
        // Good standing criteria:
        // - Karma >= 50
        // - Dispute rate < 50%
        // - Active in last 30 days
        return rep.karma >= 50 && 
               _calculateDisputeRate(tokenId) < 50 &&
               block.timestamp - rep.lastActivityAt < 30 days;
    }

    function _calculateDisputeRate(uint256 tokenId) private view returns (uint256) {
        Reputation memory rep = reputations[tokenId];
        if (rep.totalDisputes == 0) return 0;
        return (rep.disputesLost * 100) / rep.totalDisputes;
    }

    // Override transfer functions to make SBT non-transferable
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning, but not transfers
        require(from == address(0) || to == address(0), "SBT: Transfer not allowed");
        
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
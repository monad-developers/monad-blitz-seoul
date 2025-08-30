// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMonaddit.sol";

contract ModerationGame is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    IContentRegistry public contentRegistry;
    IStakingVault public stakingVault;
    IReputationSBT public reputationSBT;

    uint256 public constant JURY_SIZE = 7;
    uint256 public constant COMMIT_PHASE_DURATION = 2 days;
    uint256 public constant REVEAL_PHASE_DURATION = 1 days;
    uint256 public constant MIN_JURORS_FOR_VERDICT = 5;

    enum DisputeStatus {
        Initialized,
        CommitPhase,
        RevealPhase,
        Resolved,
        Cancelled
    }

    struct Dispute {
        uint256 contentId;
        address challenger;
        uint256 challengerBond;
        DisputeStatus status;
        uint256 commitDeadline;
        uint256 revealDeadline;
        address[] selectedJurors;
        uint256 guiltyVotes;
        uint256 notGuiltyVotes;
        bytes32 evidenceRoot;
    }

    struct JurorVote {
        bytes32 commitment;
        bool revealed;
        bool vote;
    }

    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => mapping(address => JurorVote)) public jurorVotes;
    mapping(address => uint256[]) public jurorDisputes;
    
    uint256 public nextDisputeId;
    address[] public eligibleJurors;

    event DisputeInitialized(uint256 indexed disputeId, uint256 indexed contentId, address indexed challenger);
    event JurySelected(uint256 indexed disputeId, address[] jurors);
    event VoteCommitted(uint256 indexed disputeId, address indexed juror);
    event VoteRevealed(uint256 indexed disputeId, address indexed juror, bool vote);
    event DisputeResolved(uint256 indexed disputeId, bool guilty, uint256 guiltyVotes, uint256 notGuiltyVotes);

    constructor(address _contentRegistry, address _stakingVault) {
        contentRegistry = IContentRegistry(_contentRegistry);
        stakingVault = IStakingVault(_stakingVault);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function setReputationSBT(address _reputationSBT) external onlyRole(ADMIN_ROLE) {
        reputationSBT = IReputationSBT(_reputationSBT);
    }

    function registerAsJuror() external {
        require(stakingVault.isEligibleStaker(msg.sender), "Not eligible staker");
        
        for (uint i = 0; i < eligibleJurors.length; i++) {
            if (eligibleJurors[i] == msg.sender) {
                revert("Already registered");
            }
        }
        
        eligibleJurors.push(msg.sender);
    }

    function initializeDispute(uint256 contentId, address challenger, uint256 challengerBond) 
        external 
        returns (uint256 disputeId)
    {
        require(msg.sender == address(contentRegistry), "Only content registry");
        
        disputeId = nextDisputeId++;
        
        address[] memory selectedJurors = _selectRandomJurors();
        
        disputes[disputeId] = Dispute({
            contentId: contentId,
            challenger: challenger,
            challengerBond: challengerBond,
            status: DisputeStatus.CommitPhase,
            commitDeadline: block.timestamp + COMMIT_PHASE_DURATION,
            revealDeadline: block.timestamp + COMMIT_PHASE_DURATION + REVEAL_PHASE_DURATION,
            selectedJurors: selectedJurors,
            guiltyVotes: 0,
            notGuiltyVotes: 0,
            evidenceRoot: bytes32(0)
        });

        for (uint i = 0; i < selectedJurors.length; i++) {
            jurorDisputes[selectedJurors[i]].push(disputeId);
        }

        emit DisputeInitialized(disputeId, contentId, challenger);
        emit JurySelected(disputeId, selectedJurors);
    }

    function commitVote(uint256 disputeId, bytes32 commitment) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.CommitPhase, "Not in commit phase");
        require(block.timestamp <= dispute.commitDeadline, "Commit phase ended");
        require(_isSelectedJuror(disputeId, msg.sender), "Not selected juror");
        require(jurorVotes[disputeId][msg.sender].commitment == bytes32(0), "Already committed");

        jurorVotes[disputeId][msg.sender].commitment = commitment;

        emit VoteCommitted(disputeId, msg.sender);

        if (block.timestamp > dispute.commitDeadline) {
            _transitionToRevealPhase(disputeId);
        }
    }

    function revealVote(uint256 disputeId, bool vote, bytes32 salt) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        
        if (dispute.status == DisputeStatus.CommitPhase && block.timestamp > dispute.commitDeadline) {
            _transitionToRevealPhase(disputeId);
        }
        
        require(dispute.status == DisputeStatus.RevealPhase, "Not in reveal phase");
        require(block.timestamp <= dispute.revealDeadline, "Reveal phase ended");
        
        JurorVote storage jurorVote = jurorVotes[disputeId][msg.sender];
        require(jurorVote.commitment != bytes32(0), "No commitment found");
        require(!jurorVote.revealed, "Already revealed");
        
        bytes32 computedCommitment = keccak256(abi.encodePacked(vote, salt, msg.sender));
        require(computedCommitment == jurorVote.commitment, "Invalid reveal");

        jurorVote.revealed = true;
        jurorVote.vote = vote;

        if (vote) {
            dispute.guiltyVotes++;
        } else {
            dispute.notGuiltyVotes++;
        }

        emit VoteRevealed(disputeId, msg.sender, vote);

        if (block.timestamp > dispute.revealDeadline || 
            dispute.guiltyVotes + dispute.notGuiltyVotes >= MIN_JURORS_FOR_VERDICT) {
            _resolveDispute(disputeId);
        }
    }

    function finalizeDispute(uint256 disputeId) external nonReentrant {
        Dispute storage dispute = disputes[disputeId];
        
        if (dispute.status == DisputeStatus.CommitPhase && block.timestamp > dispute.commitDeadline) {
            _transitionToRevealPhase(disputeId);
        }
        
        if (dispute.status == DisputeStatus.RevealPhase && block.timestamp > dispute.revealDeadline) {
            _resolveDispute(disputeId);
        }
    }

    function submitEvidence(uint256 disputeId, bytes32 evidenceRoot) external {
        Dispute storage dispute = disputes[disputeId];
        require(msg.sender == dispute.challenger, "Only challenger can submit evidence");
        require(dispute.status == DisputeStatus.CommitPhase, "Can only submit during commit phase");
        
        dispute.evidenceRoot = evidenceRoot;
    }

    function _transitionToRevealPhase(uint256 disputeId) private {
        Dispute storage dispute = disputes[disputeId];
        dispute.status = DisputeStatus.RevealPhase;
    }

    function _resolveDispute(uint256 disputeId) private {
        Dispute storage dispute = disputes[disputeId];
        require(dispute.status == DisputeStatus.RevealPhase, "Not in reveal phase");
        
        dispute.status = DisputeStatus.Resolved;
        
        uint256 totalVotes = dispute.guiltyVotes + dispute.notGuiltyVotes;
        
        if (totalVotes < MIN_JURORS_FOR_VERDICT) {
            // Not enough votes, default to not guilty
            contentRegistry.resolve(dispute.contentId, false, 0);
            emit DisputeResolved(disputeId, false, dispute.guiltyVotes, dispute.notGuiltyVotes);
        } else {
            bool guilty = dispute.guiltyVotes > dispute.notGuiltyVotes;
            // If guilty, pass the challenger bond amount as slash amount
            uint256 slashAmount = guilty ? dispute.challengerBond : 0;
            contentRegistry.resolve(dispute.contentId, guilty, slashAmount);
            emit DisputeResolved(disputeId, guilty, dispute.guiltyVotes, dispute.notGuiltyVotes);
        }
    }

    function _selectRandomJurors() private view returns (address[] memory) {
        require(eligibleJurors.length >= JURY_SIZE, "Not enough eligible jurors");
        
        address[] memory selected = new address[](JURY_SIZE);
        uint256[] memory indices = new uint256[](JURY_SIZE);
        
        // Simple pseudo-random selection (should use VRF in production)
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, nextDisputeId)));
        
        for (uint i = 0; i < JURY_SIZE; i++) {
            uint256 index = (seed + i) % eligibleJurors.length;
            bool duplicate = false;
            
            for (uint j = 0; j < i; j++) {
                if (indices[j] == index) {
                    duplicate = true;
                    break;
                }
            }
            
            if (!duplicate) {
                indices[i] = index;
                selected[i] = eligibleJurors[index];
            } else {
                // Try next index
                index = (index + 1) % eligibleJurors.length;
                indices[i] = index;
                selected[i] = eligibleJurors[index];
            }
        }
        
        return selected;
    }

    function _isSelectedJuror(uint256 disputeId, address juror) private view returns (bool) {
        address[] memory jurors = disputes[disputeId].selectedJurors;
        for (uint i = 0; i < jurors.length; i++) {
            if (jurors[i] == juror) {
                return true;
            }
        }
        return false;
    }

    function getDispute(uint256 disputeId) external view returns (
        uint256 contentId,
        address challenger,
        DisputeStatus status,
        uint256 guiltyVotes,
        uint256 notGuiltyVotes,
        address[] memory selectedJurors
    ) {
        Dispute memory dispute = disputes[disputeId];
        return (
            dispute.contentId,
            dispute.challenger,
            dispute.status,
            dispute.guiltyVotes,
            dispute.notGuiltyVotes,
            dispute.selectedJurors
        );
    }

    function getJurorVote(uint256 disputeId, address juror) external view returns (
        bool hasCommitted,
        bool hasRevealed,
        bool vote
    ) {
        JurorVote memory jurorVote = jurorVotes[disputeId][juror];
        return (
            jurorVote.commitment != bytes32(0),
            jurorVote.revealed,
            jurorVote.vote
        );
    }
}
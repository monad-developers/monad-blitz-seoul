// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MonaDAOToken.sol";
import "./MockUSDT.sol";

contract MonaDAO is Ownable, ReentrancyGuard {
    IERC20 public usdt;
    MonaDAOToken public daoToken;
    
    struct Task {
        uint256 id;
        string title;
        string description;
        uint256 participationFee;
        uint256 maxParticipants;
        uint256 currentParticipants;
        uint256 deadline;
        TaskStatus status;
        address creator;
        uint256 totalReward;
        uint256 successReward;
        uint256 failurePenalty;
    }
    
    struct Participant {
        address user;
        bool isActive;
        bool hasSubmitted;
        bool isApproved;
        uint256 submissionTime;
    }
    
    struct Vote {
        address voter;
        bool approved;
        uint256 timestamp;
    }
    
    enum TaskStatus {
        Open,
        InProgress,
        UnderReview,
        Completed,
        Failed
    }
    
    mapping(uint256 => Task) public tasks;
    mapping(uint256 => mapping(address => Participant)) public participants;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => address[]) public participantList;
    mapping(uint256 => uint256) public totalVotes;
    mapping(uint256 => uint256) public approvedVotes;
    
    uint256 public taskCounter;
    uint256 public minParticipationFee = 100 * 10**6; // 100 USDT
    uint256 public maxParticipationFee = 10000 * 10**6; // 10,000 USDT
    uint256 public successRewardMultiplier = 120; // 120% (20% 보너스)
    uint256 public failurePenaltyMultiplier = 80; // 80% (20% 페널티)
    
    event TaskCreated(uint256 indexed taskId, string title, uint256 participationFee);
    event ParticipantJoined(uint256 indexed taskId, address indexed participant);
    event TaskSubmitted(uint256 indexed taskId, address indexed participant);
    event VoteCast(uint256 indexed taskId, address indexed voter, bool approved);
    event TaskCompleted(uint256 indexed taskId, bool success);
    event RewardsDistributed(uint256 indexed taskId, uint256 totalAmount);
    
    constructor(address _usdt, address _daoToken) Ownable(msg.sender) {
        usdt = IERC20(_usdt);
        daoToken = MonaDAOToken(_daoToken);
    }
    
    modifier taskExists(uint256 taskId) {
        require(tasks[taskId].creator != address(0), "Task does not exist");
        _;
    }
    
    modifier taskOpen(uint256 taskId) {
        require(tasks[taskId].status == TaskStatus.Open, "Task is not open");
        _;
    }
    
    modifier taskInProgress(uint256 taskId) {
        require(tasks[taskId].status == TaskStatus.InProgress, "Task is not in progress");
        _;
    }
    
    modifier onlyTaskCreator(uint256 taskId) {
        require(tasks[taskId].creator == msg.sender, "Only task creator can call this");
        _;
    }
    
    modifier onlyParticipant(uint256 taskId) {
        require(participants[taskId][msg.sender].isActive, "Not a participant");
        _;
    }
    
    function createTask(
        string memory title,
        string memory description,
        uint256 participationFee,
        uint256 maxParticipants,
        uint256 deadline
    ) external {
        require(participationFee >= minParticipationFee, "Fee too low");
        require(participationFee <= maxParticipationFee, "Fee too high");
        require(maxParticipants > 0, "Max participants must be > 0");
        require(deadline > block.timestamp, "Deadline must be in future");
        
        taskCounter++;
        tasks[taskCounter] = Task({
            id: taskCounter,
            title: title,
            description: description,
            participationFee: participationFee,
            maxParticipants: maxParticipants,
            currentParticipants: 0,
            deadline: deadline,
            status: TaskStatus.Open,
            creator: msg.sender,
            totalReward: 0,
            successReward: 0,
            failurePenalty: 0
        });
        
        emit TaskCreated(taskCounter, title, participationFee);
    }
    
    function joinTask(uint256 taskId) external nonReentrant taskExists(taskId) taskOpen(taskId) {
        Task storage task = tasks[taskId];
        require(task.currentParticipants < task.maxParticipants, "Task is full");
        require(!participants[taskId][msg.sender].isActive, "Already joined");
        
        // USDT 전송
        require(usdt.transferFrom(msg.sender, address(this), task.participationFee), "USDT transfer failed");
        
        participants[taskId][msg.sender] = Participant({
            user: msg.sender,
            isActive: true,
            hasSubmitted: false,
            isApproved: false,
            submissionTime: 0
        });
        
        participantList[taskId].push(msg.sender);
        task.currentParticipants++;
        task.totalReward += task.participationFee;
        
        emit ParticipantJoined(taskId, msg.sender);
        
        // 참가자가 최대치에 도달하면 자동으로 InProgress로 변경
        if (task.currentParticipants == task.maxParticipants) {
            task.status = TaskStatus.InProgress;
        }
    }
    
    function submitTask(uint256 taskId) external nonReentrant taskExists(taskId) taskInProgress(taskId) onlyParticipant(taskId) {
        Participant storage participant = participants[taskId][msg.sender];
        require(!participant.hasSubmitted, "Already submitted");
        
        participant.hasSubmitted = true;
        participant.submissionTime = block.timestamp;
        
        emit TaskSubmitted(taskId, msg.sender);
        
        // 모든 참가자가 제출했는지 확인
        Task storage task = tasks[taskId];
        bool allSubmitted = true;
        for (uint i = 0; i < participantList[taskId].length; i++) {
            if (!participants[taskId][participantList[taskId][i]].hasSubmitted) {
                allSubmitted = false;
                break;
            }
        }
        
        if (allSubmitted) {
            task.status = TaskStatus.UnderReview;
        }
    }
    
    function vote(uint256 taskId, bool approved) external taskExists(taskId) {
        require(tasks[taskId].status == TaskStatus.UnderReview, "Task not under review");
        require(daoToken.balanceOf(msg.sender) > 0, "No voting power");
        require(votes[taskId][msg.sender].timestamp == 0, "Already voted");
        
        votes[taskId][msg.sender] = Vote({
            voter: msg.sender,
            approved: approved,
            timestamp: block.timestamp
        });
        
        totalVotes[taskId]++;
        if (approved) {
            approvedVotes[taskId]++;
        }
        
        emit VoteCast(taskId, msg.sender, approved);
        
        // 모든 DAO 토큰 홀더가 투표했는지 확인 (간단한 구현)
        if (totalVotes[taskId] >= daoToken.totalSupply() / 100) { // 1% 이상 투표
            _finalizeTask(taskId);
        }
    }
    
    function _finalizeTask(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        bool success = approvedVotes[taskId] > totalVotes[taskId] / 2; // 과반수 승인
        
        if (success) {
            task.status = TaskStatus.Completed;
            task.successReward = task.totalReward * successRewardMultiplier / 100;
        } else {
            task.status = TaskStatus.Failed;
            task.failurePenalty = task.totalReward * failurePenaltyMultiplier / 100;
        }
        
        emit TaskCompleted(taskId, success);
        
        if (success) {
            _distributeSuccessRewards(taskId);
        } else {
            _distributeFailurePenalties(taskId);
        }
    }
    
    function _distributeSuccessRewards(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        uint256 rewardPerParticipant = task.successReward / task.currentParticipants;
        
        for (uint i = 0; i < participantList[taskId].length; i++) {
            address participant = participantList[taskId][i];
            if (participants[taskId][participant].isActive) {
                // USDT + 보너스 반환
                usdt.transfer(participant, rewardPerParticipant);
            }
        }
        
        emit RewardsDistributed(taskId, task.successReward);
    }
    
    function _distributeFailurePenalties(uint256 taskId) internal {
        Task storage task = tasks[taskId];
        uint256 penaltyPerParticipant = task.failurePenalty / task.currentParticipants;
        
        for (uint i = 0; i < participantList[taskId].length; i++) {
            address participant = participantList[taskId][i];
            if (participants[taskId][participant].isActive) {
                // 페널티 적용된 금액 반환
                usdt.transfer(participant, penaltyPerParticipant);
            }
        }
        
        // 실패한 금액만큼 DAO 토큰 소각
        uint256 burnAmount = task.totalReward - task.failurePenalty;
        if (burnAmount > 0) {
            daoToken.burn(burnAmount);
        }
        
        emit RewardsDistributed(taskId, task.failurePenalty);
    }
    
    // 관리자 함수들
    function setParticipationFeeLimits(uint256 min, uint256 max) external onlyOwner {
        minParticipationFee = min;
        maxParticipationFee = max;
    }
    
    function setRewardMultipliers(uint256 success, uint256 failure) external onlyOwner {
        successRewardMultiplier = success;
        failurePenaltyMultiplier = failure;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdt.balanceOf(address(this));
        if (balance > 0) {
            usdt.transfer(owner(), balance);
        }
    }
    
    // 뷰 함수들
    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
    
    function getParticipant(uint256 taskId, address user) external view returns (Participant memory) {
        return participants[taskId][user];
    }
    
    function getParticipantList(uint256 taskId) external view returns (address[] memory) {
        return participantList[taskId];
    }
    
    function getVote(uint256 taskId, address voter) external view returns (Vote memory) {
        return votes[taskId][voter];
    }
}

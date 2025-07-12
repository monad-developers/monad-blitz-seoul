// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts/src/v0.8/ccip/applications/CCIPReceiver.sol";

/**
 * @title TrendLinkRewardContract
 * @dev 검색 로그 기록 및 보상 분배를 위한 스마트 컨트랙트
 */
contract TrendLinkRewardContract is Ownable, ReentrancyGuard, Pausable, CCIPReceiver {
    // 보상 토큰 인터페이스
    IERC20 public rewardToken;
    
    // 보상 분배 비율 (basis points: 10000 = 100%)
    struct RewardRatio {
        uint256 userRatio;      // 사용자 비율
        uint256 platformRatio;  // 플랫폼 비율
        uint256 widgetRatio;    // 위젯 운영자 비율
    }
    
    RewardRatio public rewardRatio;
    
    // 검색 로그 구조체
    struct SearchLog {
        address user;
        address platform;
        address widget;
        string keyword;
        uint256 timestamp;
        uint256 rewardAmount;
        bool distributed;
    }
    
    // 검색 로그 저장
    mapping(uint256 => SearchLog) public searchLogs;
    uint256 public searchLogCount;
    
    // 사용자별 누적 보상
    mapping(address => uint256) public userRewards;
    mapping(address => uint256) public platformRewards;
    mapping(address => uint256) public widgetRewards;
    
    // 검색당 기본 보상 금액
    uint256 public baseRewardAmount;
    
    // 승인된 CCIP 송신자 목록
    mapping(address => bool) public approvedSenders;
    
    // Events
    event SearchLogged(
        uint256 indexed logId,
        address indexed user,
        address indexed platform,
        address widget,
        string keyword,
        uint256 timestamp,
        uint256 rewardAmount
    );
    
    event RewardDistributed(
        uint256 indexed logId,
        address indexed user,
        address indexed platform,
        address widget,
        uint256 userAmount,
        uint256 platformAmount,
        uint256 widgetAmount
    );
    
    event PolicyUpdated(
        uint256 userRatio,
        uint256 platformRatio,
        uint256 widgetRatio
    );
    
    event TokenUpdated(address indexed oldToken, address indexed newToken);
    
    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address indexed sender,
        bytes data
    );
    
    event TokenWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    
    event BaseRewardAmountUpdated(uint256 oldAmount, uint256 newAmount);
    
    event SenderApprovalUpdated(address indexed sender, bool approved);
    
    constructor(
        address _rewardToken,
        uint256 _baseRewardAmount,
        address _ccipRouter
    ) CCIPReceiver(_ccipRouter) {
        rewardToken = IERC20(_rewardToken);
        baseRewardAmount = _baseRewardAmount;
        
        // 초기 보상 비율 설정 (user: 30%, platform: 40%, widget: 30%)
        rewardRatio = RewardRatio({
            userRatio: 3000,      // 30%
            platformRatio: 4000,  // 40%
            widgetRatio: 3000     // 30%
        });
        
        searchLogCount = 0;
    }
    
    /**
     * @dev 검색 로그 기록 및 보상 분배
     * @param user 사용자 주소
     * @param platform 플랫폼 주소
     * @param widget 위젯 운영자 주소
     * @param keyword 검색 키워드
     */
    function logSearch(
        address user,
        address platform,
        address widget,
        string calldata keyword
    ) external whenNotPaused nonReentrant {
        require(user != address(0), "Invalid user address");
        require(platform != address(0), "Invalid platform address");
        require(widget != address(0), "Invalid widget address");
        require(bytes(keyword).length > 0, "Keyword cannot be empty");
        
        uint256 logId = searchLogCount++;
        
        // 검색 로그 저장
        searchLogs[logId] = SearchLog({
            user: user,
            platform: platform,
            widget: widget,
            keyword: keyword,
            timestamp: block.timestamp,
            rewardAmount: baseRewardAmount,
            distributed: false
        });
        
        emit SearchLogged(
            logId,
            user,
            platform,
            widget,
            keyword,
            block.timestamp,
            baseRewardAmount
        );
        
        // 보상 분배 실행
        _distributeReward(logId);
    }
    
    /**
     * @dev 보상 분배 실행
     * @param logId 검색 로그 ID
     */
    function _distributeReward(uint256 logId) internal {
        SearchLog storage log = searchLogs[logId];
        require(!log.distributed, "Reward already distributed");
        
        uint256 totalReward = log.rewardAmount;
        
        // 각 참여자별 보상 계산
        uint256 userAmount = (totalReward * rewardRatio.userRatio) / 10000;
        uint256 platformAmount = (totalReward * rewardRatio.platformRatio) / 10000;
        uint256 widgetAmount = (totalReward * rewardRatio.widgetRatio) / 10000;
        
        // 토큰 잔액 확인
        require(
            rewardToken.balanceOf(address(this)) >= totalReward,
            "Insufficient reward tokens"
        );
        
        // 보상 전송
        require(rewardToken.transfer(log.user, userAmount), "User reward transfer failed");
        require(rewardToken.transfer(log.platform, platformAmount), "Platform reward transfer failed");
        require(rewardToken.transfer(log.widget, widgetAmount), "Widget reward transfer failed");
        
        // 누적 보상 업데이트
        userRewards[log.user] += userAmount;
        platformRewards[log.platform] += platformAmount;
        widgetRewards[log.widget] += widgetAmount;
        
        // 분배 완료 표시
        log.distributed = true;
        
        emit RewardDistributed(
            logId,
            log.user,
            log.platform,
            log.widget,
            userAmount,
            platformAmount,
            widgetAmount
        );
    }
    
    /**
     * @dev 보상 정책 업데이트 (관리자만)
     * @param userRatio 사용자 비율 (basis points)
     * @param platformRatio 플랫폼 비율 (basis points)
     * @param widgetRatio 위젯 비율 (basis points)
     */
    function setRewardPolicy(
        uint256 userRatio,
        uint256 platformRatio,
        uint256 widgetRatio
    ) external onlyOwner {
        require(
            userRatio + platformRatio + widgetRatio == 10000,
            "Ratios must sum to 10000"
        );
        
        rewardRatio = RewardRatio({
            userRatio: userRatio,
            platformRatio: platformRatio,
            widgetRatio: widgetRatio
        });
        
        emit PolicyUpdated(userRatio, platformRatio, widgetRatio);
    }
    
    /**
     * @dev 보상 토큰 주소 업데이트 (관리자만)
     * @param newToken 새로운 토큰 주소
     */
    function setRewardToken(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token address");
        
        address oldToken = address(rewardToken);
        rewardToken = IERC20(newToken);
        
        emit TokenUpdated(oldToken, newToken);
    }
    
    /**
     * @dev 기본 보상 금액 업데이트 (관리자만)
     * @param newAmount 새로운 기본 보상 금액
     */
    function setBaseRewardAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        
        uint256 oldAmount = baseRewardAmount;
        baseRewardAmount = newAmount;
        
        emit BaseRewardAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @dev CCIP 송신자 승인 관리 (관리자만)
     * @param sender 송신자 주소
     * @param approved 승인 여부
     */
    function setApprovedSender(address sender, bool approved) external onlyOwner {
        approvedSenders[sender] = approved;
        emit SenderApprovalUpdated(sender, approved);
    }
    
    /**
     * @dev CCIP 메시지 수신 처리
     * @param any2EvmMessage 수신된 메시지
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        // 송신자 검증
        require(
            approvedSenders[abi.decode(any2EvmMessage.sender, (address))],
            "Sender not approved"
        );
        
        // 메시지 데이터 디코딩 및 처리
        (
            address user,
            address platform,
            address widget,
            string memory keyword
        ) = abi.decode(any2EvmMessage.data, (address, address, address, string));
        
        // 검색 로그 기록
        this.logSearch(user, platform, widget, keyword);
        
        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            any2EvmMessage.data
        );
    }
    
    /**
     * @dev 토큰 인출 (관리자만)
     * @param token 인출할 토큰 주소
     * @param to 인출 대상 주소
     * @param amount 인출 금액
     */
    function withdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        
        if (token == address(0)) {
            // ETH 인출
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(to).transfer(amount);
        } else {
            // ERC20 토큰 인출
            IERC20 tokenContract = IERC20(token);
            require(
                tokenContract.balanceOf(address(this)) >= amount,
                "Insufficient token balance"
            );
            require(tokenContract.transfer(to, amount), "Token transfer failed");
        }
        
        emit TokenWithdrawn(token, to, amount);
    }
    
    /**
     * @dev 컨트랙트 일시 정지 (관리자만)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 컨트랙트 일시 정지 해제 (관리자만)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 특정 사용자의 검색 로그 조회
     * @param user 사용자 주소
     * @return logIds 검색 로그 ID 배열
     */
    function getUserSearchLogs(address user) external view returns (uint256[] memory logIds) {
        uint256 count = 0;
        
        // 먼저 해당 사용자의 로그 개수 계산
        for (uint256 i = 0; i < searchLogCount; i++) {
            if (searchLogs[i].user == user) {
                count++;
            }
        }
        
        // 로그 ID 배열 생성
        logIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < searchLogCount; i++) {
            if (searchLogs[i].user == user) {
                logIds[index] = i;
                index++;
            }
        }
        
        return logIds;
    }
    
    /**
     * @dev 컨트랙트 상태 조회
     * @return 현재 설정 정보
     */
    function getContractInfo() external view returns (
        address tokenAddress,
        uint256 baseReward,
        uint256 userRatio,
        uint256 platformRatio,
        uint256 widgetRatio,
        uint256 totalLogs,
        bool isPaused
    ) {
        return (
            address(rewardToken),
            baseRewardAmount,
            rewardRatio.userRatio,
            rewardRatio.platformRatio,
            rewardRatio.widgetRatio,
            searchLogCount,
            paused()
        );
    }
    
    // ETH 수신을 위한 함수
    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {CCIPReceiver} from '@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol';
import {Client} from '@chainlink/contracts-ccip/contracts/libraries/Client.sol';

/**
 * @title SearchReward
 * @dev TrendLink 검색/보상 분배 스마트컨트랙트 (CCIP 연동)
 * @notice 검색 시점에 CCIP로 메시지를 받아 즉시 블록체인에 기록하고 보상 분배
 * 
 * 주요 기능:
 * 1. 검색 로그를 컨트랙트에 영구 저장
 * 2. 검색어별 카운팅 및 통계
 * 3. 3자 보상 분배 (사용자, 플랫폼, TrendLink)
 * 4. 구매자가 요청할 수 있는 검색 데이터 제공
 */
contract SearchReward is CCIPReceiver, Ownable, ReentrancyGuard {
    // ========== 상태 변수 ==========
    
    // 보상에 사용할 ERC20 토큰 컨트랙트
    IERC20 public rewardToken;
    
    // TrendLink(운영자) 계정 주소
    address public trendLink;
    
    // 검색당 보상 금액 (Wei 단위) - 기본 1 토큰
    uint256 public searchRewardAmount = 1000000000000000000; // 1 토큰

    // 보상 분배 비율(%) - 사용자, 플랫폼, TrendLink(최소 2% 보장)
    uint256 public userPct = 49;        // 사용자 49%
    uint256 public platformPct = 49;    // 플랫폼 49%
    uint256 public trendLinkPct = 2;    // TrendLink 2%

    // ========== 데이터 구조체 ==========
    
    /**
     * @dev 검색 로그 구조체
     * @param logId 검색 로그 고유 ID
     * @param user 사용자 지갑 주소
     * @param platform 플랫폼(기업) 지갑 주소
     * @param keyword 검색 키워드
     * @param timestamp 검색 시각(Unix time)
     * @param amount 결제 금액(토큰 단위)
     * @param exists 로그 존재 여부
     */
    struct SearchLog {
        uint256 logId;
        address user;
        address platform;
        string keyword;
        uint256 timestamp;
        uint256 amount;
        bool exists;
    }

    /**
     * @dev 구매자가 요청할 수 있는 검색 데이터 구조체
     * @param logIds 검색 로그 ID 배열
     * @param keywords 검색 키워드 배열
     * @param keywordCounts 검색어별 카운트 배열
     * @param totalSearches 총 검색 로그 수
     */
    struct SearchData {
        uint256[] logIds;
        string[] keywords;
        uint256[] keywordCounts;
        uint256 totalSearches;
    }

    // ========== 저장소 ==========
    
    // 검색 로그 저장소 - logId를 키로 사용하여 검색 로그 저장
    mapping(uint256 => SearchLog) public searchLogs;
    
    // 총 검색 로그 수
    uint256 public totalSearchLogs;

    // 검색어별 카운팅 저장소 - 검색어를 키로 사용하여 카운트 저장
    mapping(string => uint256) public keywordCount;
    
    // 모든 검색어 목록 배열
    string[] public allKeywords;

    // ========== 이벤트 ==========
    
    /**
     * @dev 검색 로그 기록 이벤트
     * @param logId 검색 로그 고유 ID
     * @param user 사용자 지갑 주소
     * @param platform 플랫폼 지갑 주소
     * @param trendLink TrendLink 운영자 주소
     * @param keyword 검색 키워드
     * @param timestamp 검색 시각
     * @param rewardAmount 보상 금액
     */
    event SearchLogged(
        uint256 indexed logId,
        address indexed user,
        address indexed platform,
        address trendLink,
        string keyword,
        uint256 timestamp,
        uint256 rewardAmount
    );
    
    /**
     * @dev 보상 분배 이벤트
     * @param user 사용자 주소
     * @param userAmount 사용자 보상 금액
     * @param platform 플랫폼 주소
     * @param platformAmount 플랫폼 보상 금액
     * @param trendLink TrendLink 주소
     * @param trendLinkAmount TrendLink 보상 금액
     */
    event RewardDistributed(
        address user,
        uint256 userAmount,
        address platform,
        uint256 platformAmount,
        address trendLink,
        uint256 trendLinkAmount
    );
    
    /**
     * @dev 보상 정책 변경 이벤트
     */
    event RewardPolicyUpdated(uint256 userPct, uint256 platformPct, uint256 trendLinkPct);
    
    /**
     * @dev 보상 토큰 변경 이벤트
     */
    event RewardTokenUpdated(address token);
    
    /**
     * @dev 검색 보상 금액 변경 이벤트
     */
    event SearchRewardAmountUpdated(uint256 newAmount);
    
    /**
     * @dev 검색어 카운팅 이벤트
     */
    event KeywordCounted(string keyword, uint256 count);
    
    /**
     * @dev 인출 이벤트
     */
    event Withdrawn(address to, uint256 amount);

    // ========== 생성자 ==========
    
    /**
     * @dev 생성자
     * @param _router Chainlink CCIP Router 주소
     * @param _rewardToken 보상에 사용할 ERC20 토큰 주소
     * @param _trendLink TrendLink(운영자) 계정 주소
     * @param _owner Ownable 권한을 가질 관리자 주소
     */
    constructor(address _router, address _rewardToken, address _trendLink, address _owner) CCIPReceiver(_router) Ownable(_owner) {
        rewardToken = IERC20(_rewardToken);
        trendLink = _trendLink;
    }

    // ========== 관리자 함수 ==========
    
    /**
     * @dev 보상 비율(%) 정책 변경 (onlyOwner)
     * @param _userPct 사용자 보상 비율
     * @param _platformPct 플랫폼 보상 비율
     * @param _trendLinkPct TrendLink 보상 비율
     */
    function setRewardPolicy(uint256 _userPct, uint256 _platformPct, uint256 _trendLinkPct) external onlyOwner {
        require(_trendLinkPct >= 2, "TrendLink pct must be at least 2");
        require(_userPct + _platformPct + _trendLinkPct == 100, "Total must be 100");
        userPct = _userPct;
        platformPct = _platformPct;
        trendLinkPct = _trendLinkPct;
        emit RewardPolicyUpdated(_userPct, _platformPct, _trendLinkPct);
    }

    /**
     * @dev 보상 토큰 변경 (onlyOwner)
     * @param _token 새로운 토큰 주소
     */
    function setRewardToken(address _token) external onlyOwner {
        rewardToken = IERC20(_token);
        emit RewardTokenUpdated(_token);
    }

    /**
     * @dev 검색당 보상 금액 변경 (onlyOwner)
     * @param _amount 새로운 보상 금액 (Wei 단위)
     */
    function setSearchRewardAmount(uint256 _amount) external onlyOwner {
        searchRewardAmount = _amount;
        emit SearchRewardAmountUpdated(_amount);
    }

    // ========== CCIP 함수 ==========
    
    /**
     * @dev CCIP 메시지 수신 (Chainlink CCIP)
     * @param message CCIP로 전달된 메시지 구조체
     * 메시지 포맷: (uint256 logId, address user, address platform, string keyword, uint256 timestamp)
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        bytes memory data = message.data;
        (uint256 logId, address user, address platform, string memory keyword, uint256 timestamp) = abi.decode(
            data,
            (uint256, address, address, string, uint256)
        );
        searchLog(logId, user, platform, keyword, timestamp);
    }

    // ========== 메인 함수 ==========
    
    /**
     * @dev 검색 로그 기록 및 보상 분배 (검색 시점에 호출)
     * @param logId 검색 로그 고유 ID
     * @param user 사용자 지갑 주소 (로그인 시) 또는 익명 UUID
     * @param platform 플랫폼(기업) 지갑 주소
     * @param keyword 검색 키워드
     * @param timestamp 검색 시각(Unix time)
     */
    function searchLog(
        uint256 logId,
        address user,
        address platform,
        string memory keyword,
        uint256 timestamp
    ) public nonReentrant {
        // 입력값 검증
        require(user != address(0), "Invalid user address");
        require(platform != address(0), "Invalid platform address");
        require(bytes(keyword).length > 0, "Keyword cannot be empty");
        require(timestamp > 0, "Invalid timestamp");

        // 컨트랙트에 충분한 토큰이 있는지 확인
        require(rewardToken.balanceOf(address(this)) >= searchRewardAmount, "Insufficient contract balance");

        // 검색 로그 저장
        _storeSearchLog(logId, user, platform, keyword, timestamp, searchRewardAmount);

        // 검색어 카운팅
        _countKeyword(keyword);

        // 보상 분배 계산
        uint256 userAmount = (searchRewardAmount * userPct) / 100;
        uint256 platformAmount = (searchRewardAmount * platformPct) / 100;
        uint256 trendLinkAmount = searchRewardAmount - userAmount - platformAmount;

        // 보상 분배 (TrendLink가 미리 예치한 토큰에서)
        if (userAmount > 0) {
            require(rewardToken.transfer(user, userAmount), "User reward transfer failed");
        }
        if (platformAmount > 0) {
            require(rewardToken.transfer(platform, platformAmount), "Platform reward transfer failed");
        }
        if (trendLinkAmount > 0) {
            require(rewardToken.transfer(trendLink, trendLinkAmount), "TrendLink reward transfer failed");
        }

        // 이벤트 발생
        emit SearchLogged(logId, user, platform, trendLink, keyword, timestamp, searchRewardAmount);
        emit RewardDistributed(user, userAmount, platform, platformAmount, trendLink, trendLinkAmount);
    }

    // ========== 내부 함수 ==========
    
    /**
     * @dev 검색 로그 저장 (내부 함수)
     * @param logId 검색 로그 고유 ID
     * @param user 사용자 지갑 주소
     * @param platform 플랫폼 지갑 주소
     * @param keyword 검색 키워드
     * @param timestamp 검색 시각
     * @param amount 보상 금액
     */
    function _storeSearchLog(
        uint256 logId,
        address user,
        address platform,
        string memory keyword,
        uint256 timestamp,
        uint256 amount
    ) internal {
        require(!searchLogs[logId].exists, "Search log already exists");
        
        searchLogs[logId] = SearchLog({
            logId: logId,
            user: user,
            platform: platform,
            keyword: keyword,
            timestamp: timestamp,
            amount: amount,
            exists: true
        });
        
        totalSearchLogs++;
    }

    /**
     * @dev 검색어 카운팅 (내부 함수)
     * @param keyword 검색어
     */
    function _countKeyword(string memory keyword) internal {
        if (keywordCount[keyword] == 0) {
            // 새로운 검색어인 경우 배열에 추가
            allKeywords.push(keyword);
        }
        
        keywordCount[keyword]++;
        emit KeywordCounted(keyword, keywordCount[keyword]);
    }

    // ========== 토큰 관리 함수 ==========
    
    /**
     * @dev 컨트랙트에 토큰 예치 (TrendLink가 호출)
     * @param amount 예치할 토큰 양
     */
    function depositTokens(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "TransferFrom failed");
    }

    /**
     * @dev 컨트랙트에 남은 토큰 인출 (onlyOwner)
     * @param to 인출받을 주소
     * @param amount 인출할 금액
     */
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(rewardToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        rewardToken.transfer(to, amount);
        emit Withdrawn(to, amount);
    }

    // ========== 조회 함수 ==========
    
    /**
     * @dev 구매자가 요청할 수 있는 검색 데이터 반환
     * @param startIndex 시작 인덱스
     * @param endIndex 끝 인덱스
     * @return 검색 데이터 구조체
     */
    function getSearchData(uint256 startIndex, uint256 endIndex) external view returns (SearchData memory) {
        require(startIndex < totalSearchLogs, "Start index out of range");
        require(endIndex <= totalSearchLogs, "End index out of range");
        require(startIndex <= endIndex, "Invalid index range");

        uint256 dataLength = endIndex - startIndex;
        uint256[] memory logIds = new uint256[](dataLength);
        string[] memory keywords = new string[](dataLength);
        uint256[] memory keywordCounts = new uint256[](allKeywords.length);

        // 검색 로그 데이터 수집
        uint256 currentIndex = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            // logId는 순차적으로 증가한다고 가정
            uint256 logId = i + 1;
            if (searchLogs[logId].exists) {
                logIds[currentIndex] = searchLogs[logId].logId;
                keywords[currentIndex] = searchLogs[logId].keyword;
                currentIndex++;
            }
        }

        // 검색어 카운트 데이터 수집
        for (uint256 i = 0; i < allKeywords.length; i++) {
            keywordCounts[i] = keywordCount[allKeywords[i]];
        }

        return SearchData({
            logIds: logIds,
            keywords: keywords,
            keywordCounts: keywordCounts,
            totalSearches: totalSearchLogs
        });
    }

    /**
     * @dev 특정 검색어의 카운트 조회
     * @param keyword 검색어
     * @return 카운트
     */
    function getKeywordCount(string memory keyword) external view returns (uint256) {
        return keywordCount[keyword];
    }

    /**
     * @dev 모든 검색어 목록 조회
     * @return 검색어 배열
     */
    function getAllKeywords() external view returns (string[] memory) {
        return allKeywords;
    }

    /**
     * @dev 특정 검색 로그 조회
     * @param logId 검색 로그 ID
     * @return 검색 로그 구조체
     */
    function getSearchLog(uint256 logId) external view returns (SearchLog memory) {
        require(searchLogs[logId].exists, "Search log does not exist");
        return searchLogs[logId];
    }

    /**
     * @dev 총 검색 로그 수 조회
     * @return 총 검색 로그 수
     */
    function getTotalSearchLogs() external view returns (uint256) {
        return totalSearchLogs;
    }

    /**
     * @dev 컨트랙트 토큰 잔액 조회
     * @return 토큰 잔액
     */
    function getContractBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    // ========== 외부 호출 함수 ==========
    
    /**
     * @dev 외부에서 직접 검색 로그 저장 (테스트용)
     * @param logId 검색 로그 고유 ID
     * @param user 사용자 지갑 주소
     * @param platform 플랫폼(기업) 지갑 주소
     * @param keyword 검색 키워드
     * @param timestamp 검색 시각(Unix time)
     */
    function storeSearchLogExternal(
        uint256 logId,
        address user,
        address platform,
        string memory keyword,
        uint256 timestamp
    ) external {
        require(user != address(0), "Invalid user address");
        require(platform != address(0), "Invalid platform address");
        require(bytes(keyword).length > 0, "Keyword cannot be empty");
        require(timestamp > 0, "Invalid timestamp");

        // 검색 로그 저장
        _storeSearchLog(logId, user, platform, keyword, timestamp, 0);

        // 검색어 카운팅
        _countKeyword(keyword);

        emit SearchLogged(logId, user, platform, trendLink, keyword, timestamp, 0);
    }
}
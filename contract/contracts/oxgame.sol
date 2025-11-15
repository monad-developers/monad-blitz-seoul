// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title OXGame
 * @notice Monad 체인에서 실행되는 OX 게임 컨트랙트
 * @dev 각 체인별 풀을 운영하며, 플레이어들이 OX 퀴즈를 맞추는 게임
 */
contract OXGame {
    // 상수
    uint256 public constant DEPOSIT_AMOUNT = 1 ether; // 1 MONAD
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant ROUND_DURATION = 5 seconds;
    
    // 체인 타입
    enum ChainType { ETH, LINK, BTC }
    
    // 플레이어 정보
    struct Player {
        address playerAddress;
        uint256 correctRounds;
        bool isActive;
        uint256 joinedAt;
    }
    
    // 풀 정보
    struct Pool {
        mapping(address => Player) players;
        address[] playerAddresses;
        uint256 totalDeposit;
        uint256 currentRound;
        uint256 lastRoundTime;
        bool isActive;
        uint256 activePlayerCount;
    }
    
    // 라운드 정보
    struct Round {
        bool answer; // true = O, false = X
        uint256 timestamp;
        mapping(address => bool) submissions;
        mapping(address => bool) hasSubmitted;
    }
    
    // 상태 변수
    mapping(ChainType => Pool) public pools;
    mapping(ChainType => mapping(uint256 => Round)) public rounds;
    
    address public oracle; // 정답을 제공하는 계정
    
    // 이벤트
    event PoolCreated(ChainType indexed chainType);
    event PlayerJoined(ChainType indexed chainType, address indexed player);
    event SubmissionReceived(ChainType indexed chainType, address indexed player, uint256 round, bool answer);
    event PlayerEliminated(ChainType indexed chainType, address indexed player, uint256 round);
    event RoundStarted(ChainType indexed chainType, uint256 round, bool answer);
    event GameEnded(ChainType indexed chainType, address[] winners, uint256 prizePerWinner);
    
    // 에러
    error InvalidDepositAmount();
    error PoolFull();
    error AlreadyJoined();
    error PoolNotActive();
    error NotOracle();
    error RoundNotStarted();
    error AlreadySubmitted();
    error PlayerNotActive();
    error TooEarlyToSubmit();
    
    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }
    
    constructor(address _oracle) {
        oracle = _oracle;
        
        // 각 체인 타입별 풀 초기화
        pools[ChainType.ETH].isActive = true;
        pools[ChainType.LINK].isActive = true;
        pools[ChainType.BTC].isActive = true;
        
        emit PoolCreated(ChainType.ETH);
        emit PoolCreated(ChainType.LINK);
        emit PoolCreated(ChainType.BTC);
    }
    
    /**
     * @notice 풀에 참여 (1 MONAD 예치)
     * @param _chainType 참여할 체인 타입
     */
    function joinPool(ChainType _chainType) external payable {
        Pool storage pool = pools[_chainType];
        
        if (msg.value != DEPOSIT_AMOUNT) revert InvalidDepositAmount();
        if (!pool.isActive) revert PoolNotActive();
        if (pool.playerAddresses.length >= MAX_PLAYERS) revert PoolFull();
        if (pool.players[msg.sender].playerAddress != address(0)) revert AlreadyJoined();
        
        pool.players[msg.sender] = Player({
            playerAddress: msg.sender,
            correctRounds: 0,
            isActive: true,
            joinedAt: block.timestamp
        });
        
        pool.playerAddresses.push(msg.sender);
        pool.totalDeposit += msg.value;
        pool.activePlayerCount++;
        
        emit PlayerJoined(_chainType, msg.sender);
    }
    
    /**
     * @notice 오라클이 새 라운드 시작 및 정답 설정
     * @param _chainType 체인 타입
     * @param _answer 정답 (true = O, false = X)
     */
    function startRound(ChainType _chainType, bool _answer) external onlyOracle {
        Pool storage pool = pools[_chainType];
        if (!pool.isActive) revert PoolNotActive();
        
        pool.currentRound++;
        pool.lastRoundTime = block.timestamp;
        
        Round storage round = rounds[_chainType][pool.currentRound];
        round.answer = _answer;
        round.timestamp = block.timestamp;
        
        emit RoundStarted(_chainType, pool.currentRound, _answer);
    }
    
    /**
     * @notice 플레이어의 OX 답변 제출
     * @param _chainType 체인 타입
     * @param _answer 플레이어의 답변 (true = O, false = X)
     */
    function submitAnswer(ChainType _chainType, bool _answer) external {
        Pool storage pool = pools[_chainType];
        Player storage player = pool.players[msg.sender];
        
        if (!player.isActive) revert PlayerNotActive();
        if (pool.currentRound == 0) revert RoundNotStarted();
        
        Round storage round = rounds[_chainType][pool.currentRound];
        
        if (round.hasSubmitted[msg.sender]) revert AlreadySubmitted();
        if (block.timestamp < pool.lastRoundTime) revert TooEarlyToSubmit();
        if (block.timestamp > pool.lastRoundTime + ROUND_DURATION) {
            // 시간 초과 시 오답 처리
            _eliminatePlayer(_chainType, msg.sender);
            return;
        }
        
        round.submissions[msg.sender] = _answer;
        round.hasSubmitted[msg.sender] = true;
        
        emit SubmissionReceived(_chainType, msg.sender, pool.currentRound, _answer);
        
        // 정답 확인 및 처리
        if (_answer != round.answer) {
            _eliminatePlayer(_chainType, msg.sender);
        } else {
            player.correctRounds++;
        }
        
        // 게임 종료 조건 확인
        _checkGameEnd(_chainType);
    }
    
    /**
     * @notice 플레이어 탈락 처리
     * @param _chainType 체인 타입
     * @param _player 탈락할 플레이어 주소
     */
    function _eliminatePlayer(ChainType _chainType, address _player) internal {
        Pool storage pool = pools[_chainType];
        Player storage player = pool.players[_player];
        
        if (player.isActive) {
            player.isActive = false;
            pool.activePlayerCount--;
            
            emit PlayerEliminated(_chainType, _player, pool.currentRound);
        }
    }
    
    /**
     * @notice 게임 종료 조건 확인 및 상금 분배
     * @param _chainType 체인 타입
     */
    function _checkGameEnd(ChainType _chainType) internal {
        Pool storage pool = pools[_chainType];
        
        // 활성 플레이어가 1명 이하일 때 게임 종료
        if (pool.activePlayerCount <= 1 && pool.activePlayerCount > 0) {
            _endGame(_chainType);
        } else if (pool.activePlayerCount == 0) {
            // 모든 플레이어가 탈락한 경우
            pool.isActive = false;
        }
    }
    
    /**
     * @notice 게임 종료 및 상금 분배
     * @param _chainType 체인 타입
     */
    function _endGame(ChainType _chainType) internal {
        Pool storage pool = pools[_chainType];
        
        // 남은 플레이어 찾기
        address[] memory winners = new address[](pool.activePlayerCount);
        uint256 winnerCount = 0;
        
        for (uint256 i = 0; i < pool.playerAddresses.length; i++) {
            address playerAddr = pool.playerAddresses[i];
            if (pool.players[playerAddr].isActive) {
                winners[winnerCount] = playerAddr;
                winnerCount++;
            }
        }
        
        // 상금 분배
        if (winnerCount > 0) {
            uint256 prizePerWinner = pool.totalDeposit / winnerCount;
            
            for (uint256 i = 0; i < winnerCount; i++) {
                payable(winners[i]).transfer(prizePerWinner);
            }
            
            emit GameEnded(_chainType, winners, prizePerWinner);
        }
        
        pool.isActive = false;
    }
    
    /**
     * @notice 플레이어의 맞춘 라운드 수 조회
     * @param _chainType 체인 타입
     * @param _player 플레이어 주소
     * @return 맞춘 라운드 수
     */
    function getPlayerCorrectRounds(ChainType _chainType, address _player) external view returns (uint256) {
        return pools[_chainType].players[_player].correctRounds;
    }
    
    /**
     * @notice 플레이어 정보 조회
     * @param _chainType 체인 타입
     * @param _player 플레이어 주소
     */
    function getPlayerInfo(ChainType _chainType, address _player) external view returns (
        address playerAddress,
        uint256 correctRounds,
        bool isActive,
        uint256 joinedAt
    ) {
        Player memory player = pools[_chainType].players[_player];
        return (player.playerAddress, player.correctRounds, player.isActive, player.joinedAt);
    }
    
    /**
     * @notice 풀 정보 조회
     * @param _chainType 체인 타입
     */
    function getPoolInfo(ChainType _chainType) external view returns (
        uint256 totalDeposit,
        uint256 currentRound,
        uint256 lastRoundTime,
        bool isActive,
        uint256 activePlayerCount,
        uint256 totalPlayerCount
    ) {
        Pool storage pool = pools[_chainType];
        return (
            pool.totalDeposit,
            pool.currentRound,
            pool.lastRoundTime,
            pool.isActive,
            pool.activePlayerCount,
            pool.playerAddresses.length
        );
    }
    
    /**
     * @notice 풀의 모든 플레이어 주소 조회
     * @param _chainType 체인 타입
     */
    function getPoolPlayers(ChainType _chainType) external view returns (address[] memory) {
        return pools[_chainType].playerAddresses;
    }
    
    /**
     * @notice 오라클 주소 변경 (현재 오라클만 가능)
     * @param _newOracle 새 오라클 주소
     */
    function setOracle(address _newOracle) external onlyOracle {
        oracle = _newOracle;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title OXGameV2
 * @notice 5초마다 반복되는 OX 게임 컨트랙트 (Monad 테스트넷)
 * @dev Oracle이 5초마다 processRound를 호출하여 이전 라운드 정답 처리 + 새 라운드 시작
 */
contract OXGameV2 {
    // 상수
    uint256 public constant DEPOSIT_AMOUNT = 1 ether; // 1 MON
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
        bool answer; // 정답 (true = 상승(O), false = 하락(X))
        uint256 startTime;
        bool isFinalized; // 정답이 확정되었는지
        mapping(address => bool) submissions; // 플레이어 답변
        mapping(address => bool) hasSubmitted; // 제출 여부
    }

    // 상태 변수
    mapping(ChainType => Pool) public pools;
    mapping(ChainType => mapping(uint256 => Round)) public rounds;

    address public oracle;

    // 이벤트
    event PoolCreated(ChainType indexed chainType);
    event PlayerJoined(ChainType indexed chainType, address indexed player, uint256 playerCount);
    event RoundStarted(ChainType indexed chainType, uint256 indexed round, uint256 startTime);
    event RoundEnded(ChainType indexed chainType, uint256 indexed round, bool correctAnswer, uint256 survivorCount);
    event SubmissionReceived(ChainType indexed chainType, address indexed player, uint256 round, bool answer);
    event PlayerEliminated(ChainType indexed chainType, address indexed player, uint256 round, string reason);
    event GameEnded(ChainType indexed chainType, address[] winners, uint256 prizePerWinner);

    // 에러
    error InvalidDepositAmount();
    error PoolFull();
    error AlreadyJoined();
    error PoolNotActive();
    error NotOracle();
    error RoundNotActive();
    error AlreadySubmitted();
    error PlayerNotActive();
    error GameNotStarted();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address _oracle) {
        oracle = _oracle;

        // 풀 초기화
        pools[ChainType.ETH].isActive = true;
        pools[ChainType.LINK].isActive = true;
        pools[ChainType.BTC].isActive = true;

        emit PoolCreated(ChainType.ETH);
        emit PoolCreated(ChainType.LINK);
        emit PoolCreated(ChainType.BTC);
    }

    /**
     * @notice 풀에 참여 (1 MON 예치)
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

        emit PlayerJoined(_chainType, msg.sender, pool.playerAddresses.length);
    }

    /**
     * @notice Oracle이 5초마다 호출 - 이전 라운드 정답 처리 + 새 라운드 시작
     * @param _chainType 체인 타입
     * @param _previousAnswer 이전 라운드의 정답 (첫 라운드면 무시)
     */
    function processRound(ChainType _chainType, bool _previousAnswer) external onlyOracle {
        Pool storage pool = pools[_chainType];

        if (!pool.isActive) revert PoolNotActive();

        // 1. 이전 라운드가 있으면 정답 처리
        if (pool.currentRound > 0) {
            Round storage prevRound = rounds[_chainType][pool.currentRound];
            prevRound.answer = _previousAnswer;
            prevRound.isFinalized = true;

            // 오답자 및 미제출자 탈락 처리
            _eliminateIncorrectPlayers(_chainType, pool.currentRound, _previousAnswer);

            emit RoundEnded(_chainType, pool.currentRound, _previousAnswer, pool.activePlayerCount);

            // 게임 종료 조건 확인
            if (pool.activePlayerCount <= 1) {
                _endGame(_chainType);
                return;
            }
        }

        // 2. 새 라운드 시작
        pool.currentRound++;
        pool.lastRoundTime = block.timestamp;

        Round storage newRound = rounds[_chainType][pool.currentRound];
        newRound.startTime = block.timestamp;
        newRound.isFinalized = false;

        emit RoundStarted(_chainType, pool.currentRound, block.timestamp);
    }

    /**
     * @notice 플레이어의 OX 답변 제출 (5초 이내)
     * @param _chainType 체인 타입
     * @param _answer 답변 (true = O/상승, false = X/하락)
     */
    function submitAnswer(ChainType _chainType, bool _answer) external {
        Pool storage pool = pools[_chainType];
        Player storage player = pool.players[msg.sender];

        if (!player.isActive) revert PlayerNotActive();
        if (pool.currentRound == 0) revert GameNotStarted();

        Round storage round = rounds[_chainType][pool.currentRound];

        if (round.hasSubmitted[msg.sender]) revert AlreadySubmitted();
        if (round.isFinalized) revert RoundNotActive();

        // 5초 제한 체크
        if (block.timestamp > round.startTime + ROUND_DURATION) {
            // 시간 초과 시 탈락
            _eliminatePlayer(_chainType, msg.sender, "TimeOut");
            return;
        }

        round.submissions[msg.sender] = _answer;
        round.hasSubmitted[msg.sender] = true;

        emit SubmissionReceived(_chainType, msg.sender, pool.currentRound, _answer);
    }

    /**
     * @notice 오답자 및 미제출자 탈락 처리
     * @param _chainType 체인 타입
     * @param _roundNumber 라운드 번호
     * @param _correctAnswer 정답
     */
    function _eliminateIncorrectPlayers(
        ChainType _chainType,
        uint256 _roundNumber,
        bool _correctAnswer
    ) internal {
        Pool storage pool = pools[_chainType];
        Round storage round = rounds[_chainType][_roundNumber];

        for (uint256 i = 0; i < pool.playerAddresses.length; i++) {
            address playerAddr = pool.playerAddresses[i];
            Player storage player = pool.players[playerAddr];

            if (!player.isActive) continue;

            // 미제출 또는 오답이면 탈락
            if (!round.hasSubmitted[playerAddr]) {
                _eliminatePlayer(_chainType, playerAddr, "NoSubmission");
            } else if (round.submissions[playerAddr] != _correctAnswer) {
                _eliminatePlayer(_chainType, playerAddr, "WrongAnswer");
            } else {
                // 정답
                player.correctRounds++;
            }
        }
    }

    /**
     * @notice 플레이어 탈락 처리
     */
    function _eliminatePlayer(ChainType _chainType, address _player, string memory _reason) internal {
        Pool storage pool = pools[_chainType];
        Player storage player = pool.players[_player];

        if (player.isActive) {
            player.isActive = false;
            pool.activePlayerCount--;

            emit PlayerEliminated(_chainType, _player, pool.currentRound, _reason);
        }
    }

    /**
     * @notice 게임 종료 및 상금 분배
     */
    function _endGame(ChainType _chainType) internal {
        Pool storage pool = pools[_chainType];

        // 승자 찾기
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

    // View 함수들

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

    function getPlayerInfo(ChainType _chainType, address _player) external view returns (
        address playerAddress,
        uint256 correctRounds,
        bool isActive,
        uint256 joinedAt
    ) {
        Player storage player = pools[_chainType].players[_player];
        return (player.playerAddress, player.correctRounds, player.isActive, player.joinedAt);
    }

    function getRoundInfo(ChainType _chainType, uint256 _roundNumber) external view returns (
        uint256 startTime,
        bool isFinalized,
        bool answer
    ) {
        Round storage round = rounds[_chainType][_roundNumber];
        return (round.startTime, round.isFinalized, round.answer);
    }

    function hasPlayerSubmitted(
        ChainType _chainType,
        uint256 _roundNumber,
        address _player
    ) external view returns (bool) {
        return rounds[_chainType][_roundNumber].hasSubmitted[_player];
    }

    function getPoolPlayers(ChainType _chainType) external view returns (address[] memory) {
        return pools[_chainType].playerAddresses;
    }

    function setOracle(address _newOracle) external onlyOracle {
        oracle = _newOracle;
    }
}

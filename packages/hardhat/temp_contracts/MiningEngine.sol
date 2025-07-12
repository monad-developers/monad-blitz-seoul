// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameManager.sol";
import "./MinerNFT.sol";
import "./RewardManager.sol";
import "./interfaces/IEntropy.sol";

contract MiningEngine is Ownable, ReentrancyGuard, IEntropyConsumer {
    GameManager public gameManager;
    MinerNFT public minerNFT;
    RewardManager public rewardManager;
    IPythEntropy public entropy;
    address public entropyProvider;

    struct MiningSession {
        address player;
        uint256[3] nftIds;
        uint256 roundId;
        uint256 startTime;
        bool isActive;
        uint256 totalAttempts;
        uint256 totalSuccesses;
        uint256 lastMiningTime;
    }

    struct MiningAttempt {
        address player;
        uint256 nftId;
        uint256 roundId;
        uint256 randomNumber;
        bool success;
        uint256 timestamp;
    }

    struct PendingRequest {
        address player;
        uint256 nftId;
        uint256 roundId;
        uint256 batchIndex;
        uint256 timestamp;
    }

    uint256 public constant TPS_PER_MINER = 50; // 초당 50 트랜잭션
    uint256 public constant MAX_MINING_DURATION = 600; // 10분
    uint256 public constant MINING_INTERVAL = 200; // 0.2초 (200ms)
    uint256 public constant BATCH_SIZE = 10; // 배치당 10개 트랜잭션

    mapping(address => MiningSession) public activeSessions;
    mapping(address => MiningAttempt[]) public miningHistory;
    mapping(address => uint256) public playerTotalSuccesses;
    mapping(uint64 => PendingRequest) public pendingRequests;

    event MiningSessionStarted(address indexed player, uint256[3] nftIds, uint256 roundId, uint256 startTime);

    event MiningSuccess(
        address indexed player,
        uint256 indexed nftId,
        uint256 randomNumber,
        uint256 roundId,
        uint256 timestamp
    );

    event MiningSessionEnded(address indexed player, uint256 totalAttempts, uint256 totalSuccesses, uint256 endTime);

    event BatchMiningCompleted(address indexed player, uint256 batchAttempts, uint256 batchSuccesses);

    constructor(
        address _gameManager,
        address _minerNFT,
        address _rewardManager,
        address _entropy,
        address _entropyProvider
    ) Ownable(msg.sender) {
        gameManager = GameManager(_gameManager);
        minerNFT = MinerNFT(_minerNFT);
        rewardManager = RewardManager(_rewardManager);
        entropy = IPythEntropy(_entropy);
        entropyProvider = _entropyProvider;
    }

    function startMining(uint256[3] calldata nftIds) external nonReentrant {
        require(!activeSessions[msg.sender].isActive, "Already mining");
        require(gameManager.isRoundActive(), "No active round");

        // NFT 소유권 확인
        for (uint256 i = 0; i < 3; i++) {
            require(minerNFT.ownerOf(nftIds[i]) == msg.sender, "Not NFT owner");
        }

        GameManager.Round memory currentRound = gameManager.getCurrentRound();

        activeSessions[msg.sender] = MiningSession({
            player: msg.sender,
            nftIds: nftIds,
            roundId: currentRound.roundId,
            startTime: block.timestamp,
            isActive: true,
            totalAttempts: 0,
            totalSuccesses: 0,
            lastMiningTime: block.timestamp
        });

        emit MiningSessionStarted(msg.sender, nftIds, currentRound.roundId, block.timestamp);
    }

    function performBatchMining() external nonReentrant {
        MiningSession storage session = activeSessions[msg.sender];
        require(session.isActive, "No active session");
        require(block.timestamp >= session.lastMiningTime + (MINING_INTERVAL / 1000), "Mining too fast");
        require(block.timestamp < session.startTime + MAX_MINING_DURATION, "Mining session expired");

        GameManager.Round memory currentRound = gameManager.getCurrentRound();
        require(session.roundId == currentRound.roundId, "Round changed");

        uint256 batchSuccesses = 0;

        // 3개 NFT × 10개씩 = 30개 배치 처리 (Pyth Entropy 사용)
        for (uint256 i = 0; i < 3; i++) {
            for (uint256 j = 0; j < BATCH_SIZE; j++) {
                uint64 sequenceNumber = _requestRandomness(session.nftIds[i], j);

                // 대기 중인 요청 저장
                pendingRequests[sequenceNumber] = PendingRequest({
                    player: msg.sender,
                    nftId: session.nftIds[i],
                    roundId: session.roundId,
                    batchIndex: session.totalAttempts,
                    timestamp: block.timestamp
                });

                session.totalAttempts++;
            }
        }

        session.lastMiningTime = block.timestamp;

        emit BatchMiningCompleted(msg.sender, BATCH_SIZE * 3, batchSuccesses);

        // 세션 만료 체크
        if (block.timestamp >= session.startTime + MAX_MINING_DURATION) {
            _endMiningSession(msg.sender);
        }
    }

    function stopMining() external {
        require(activeSessions[msg.sender].isActive, "No active session");
        _endMiningSession(msg.sender);
    }

    function _endMiningSession(address player) internal {
        MiningSession storage session = activeSessions[player];

        // 완주 보너스 체크 (90,000 트랜잭션)
        if (session.totalAttempts >= 90000) {
            rewardManager.distributeCompletionBonus(player);
        }

        emit MiningSessionEnded(player, session.totalAttempts, session.totalSuccesses, block.timestamp);

        session.isActive = false;
    }

    function _requestRandomness(uint256 nftId, uint256 seed) internal returns (uint64) {
        // 사용자 랜덤값 생성
        bytes32 userRandomness = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, nftId, seed, activeSessions[msg.sender].totalAttempts)
        );

        // Pyth Entropy에 랜덤값 요청
        uint256 fee = entropy.getFee(entropyProvider);
        require(address(this).balance >= fee, "Insufficient ETH for entropy fee");

        return entropy.request{ value: fee }(entropyProvider, userRandomness, true);
    }

    function _checkMiningSuccess(
        uint256 randomNumber,
        uint256 nftId,
        GameManager.Round memory round
    ) internal view returns (bool) {
        // 범위 체크
        uint256 targetNumber = (randomNumber % (round.maxRange - round.minRange + 1)) + round.minRange;

        // 패턴 체크
        bool patternMatch = _checkPattern(targetNumber, round.pattern);
        if (!patternMatch) {
            return false;
        }

        // 성공률 체크
        uint256 effectiveSuccessRate = minerNFT.calculateEffectiveSuccessRate(nftId, round.pattern);
        uint256 successThreshold = (randomNumber % 10000);

        return successThreshold < effectiveSuccessRate;
    }

    function _checkPattern(uint256 number, GameManager.PatternType pattern) internal pure returns (bool) {
        if (pattern == GameManager.PatternType.EVEN) {
            return number % 2 == 0;
        } else if (pattern == GameManager.PatternType.ODD) {
            return number % 2 == 1;
        } else if (pattern == GameManager.PatternType.PRIME) {
            return _isPrime(number);
        } else if (pattern == GameManager.PatternType.PI) {
            return _isPiRelated(number);
        } else if (pattern == GameManager.PatternType.SQUARE) {
            return _isPerfectSquare(number);
        }
        return false;
    }

    function _isPrime(uint256 n) internal pure returns (bool) {
        if (n < 2) return false;
        if (n == 2) return true;
        if (n % 2 == 0) return false;

        for (uint256 i = 3; i * i <= n; i += 2) {
            if (n % i == 0) return false;
        }
        return true;
    }

    function _isPiRelated(uint256 n) internal pure returns (bool) {
        // 314를 포함하거나 314의 배수
        string memory numStr = _toString(n);
        return _contains(numStr, "314") || n % 314 == 0;
    }

    function _isPerfectSquare(uint256 n) internal pure returns (bool) {
        if (n == 0) return true;
        uint256 sqrt = _sqrt(n);
        return sqrt * sqrt == n;
    }

    function _sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 result = 1;
        if (x >> 128 > 0) {
            x >>= 128;
            result <<= 64;
        }
        if (x >> 64 > 0) {
            x >>= 64;
            result <<= 32;
        }
        if (x >> 32 > 0) {
            x >>= 32;
            result <<= 16;
        }
        if (x >> 16 > 0) {
            x >>= 16;
            result <<= 8;
        }
        if (x >> 8 > 0) {
            x >>= 8;
            result <<= 4;
        }
        if (x >> 4 > 0) {
            x >>= 4;
            result <<= 2;
        }
        if (x >> 2 > 0) {
            result <<= 1;
        }
        return result;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _contains(string memory str, string memory substr) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory substrBytes = bytes(substr);

        if (substrBytes.length > strBytes.length) return false;

        for (uint256 i = 0; i <= strBytes.length - substrBytes.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < substrBytes.length; j++) {
                if (strBytes[i + j] != substrBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    // 조회 함수들
    function getMiningStats(
        address player
    )
        external
        view
        returns (uint256 attempts, uint256 successes, uint256 currentTPS, bool isActive, uint256 remainingTime)
    {
        MiningSession memory session = activeSessions[player];
        uint256 elapsed = block.timestamp - session.startTime;

        return (
            session.totalAttempts,
            session.totalSuccesses,
            elapsed > 0 ? session.totalAttempts / elapsed : 0,
            session.isActive,
            session.isActive
                ? (
                    session.startTime + MAX_MINING_DURATION > block.timestamp
                        ? session.startTime + MAX_MINING_DURATION - block.timestamp
                        : 0
                )
                : 0
        );
    }

    function getMiningHistory(address player, uint256 limit) external view returns (MiningAttempt[] memory) {
        MiningAttempt[] memory history = miningHistory[player];
        if (limit == 0 || limit > history.length) {
            return history;
        }

        MiningAttempt[] memory limitedHistory = new MiningAttempt[](limit);
        uint256 startIndex = history.length - limit;
        for (uint256 i = 0; i < limit; i++) {
            limitedHistory[i] = history[startIndex + i];
        }
        return limitedHistory;
    }

    function getRecentSuccesses(uint256 count) external view returns (MiningAttempt[] memory) {
        // 최근 성공 사례들을 반환 (메타 게임용)
        // 간단한 구현으로 현재 플레이어의 성공만 반환
        MiningAttempt[] memory history = miningHistory[msg.sender];
        if (count == 0 || count > history.length) {
            return history;
        }

        MiningAttempt[] memory limitedHistory = new MiningAttempt[](count);
        uint256 startIndex = history.length - count;
        for (uint256 i = 0; i < count; i++) {
            limitedHistory[i] = history[startIndex + i];
        }
        return limitedHistory;
    }

    // Pyth Entropy 콜백 함수
    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) external override {
        require(msg.sender == address(entropy), "Only entropy contract");
        require(provider == entropyProvider, "Invalid provider");

        PendingRequest memory request = pendingRequests[sequenceNumber];
        require(request.player != address(0), "Invalid request");

        // 요청 삭제 (재진입 방지)
        delete pendingRequests[sequenceNumber];

        // 라운드 유효성 확인
        GameManager.Round memory currentRound = gameManager.getCurrentRound();
        if (request.roundId != currentRound.roundId) {
            return; // 라운드가 변경된 경우 무시
        }

        // 세션 유효성 확인
        MiningSession storage session = activeSessions[request.player];
        if (!session.isActive) {
            return; // 세션이 종료된 경우 무시
        }

        // 채굴 성공 여부 확인
        bool success = _checkMiningSuccess(uint256(randomNumber), request.nftId, currentRound);

        if (success) {
            session.totalSuccesses++;
            playerTotalSuccesses[request.player]++;

            // 성공 기록
            miningHistory[request.player].push(
                MiningAttempt({
                    player: request.player,
                    nftId: request.nftId,
                    roundId: request.roundId,
                    randomNumber: uint256(randomNumber),
                    success: true,
                    timestamp: block.timestamp
                })
            );

            // 보상 지급
            rewardManager.distributeBasicReward(request.player);

            emit MiningSuccess(request.player, request.nftId, uint256(randomNumber), request.roundId, block.timestamp);
        }
    }

    // Admin functions
    function setGameManager(address _gameManager) external onlyOwner {
        gameManager = GameManager(_gameManager);
    }

    function setMinerNFT(address _minerNFT) external onlyOwner {
        minerNFT = MinerNFT(_minerNFT);
    }

    function setRewardManager(address _rewardManager) external onlyOwner {
        rewardManager = RewardManager(_rewardManager);
    }

    function forceEndSession(address player) external onlyOwner {
        require(activeSessions[player].isActive, "No active session");
        _endMiningSession(player);
    }

    function setEntropy(address _entropy) external onlyOwner {
        entropy = IPythEntropy(_entropy);
    }

    function setEntropyProvider(address _entropyProvider) external onlyOwner {
        entropyProvider = _entropyProvider;
    }

    function getPendingRequest(uint64 sequenceNumber) external view returns (PendingRequest memory) {
        return pendingRequests[sequenceNumber];
    }

    function fundForEntropy() external payable onlyOwner {
        // 컨트랙트에 ETH 추가 (entropy fee 지불용)
    }

    function withdrawETH(address to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(to).transfer(amount);
    }

    // ETH 받기 위한 함수
    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GameManager.sol";
import "./MinerNFT.sol";
import "./RewardManager.sol";

contract MiningEngine is Ownable, ReentrancyGuard {
    GameManager public gameManager;
    MinerNFT public minerNFT;
    RewardManager public rewardManager;

    struct PlayerStats {
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

    mapping(address => PlayerStats) public playerStats;
    mapping(address => MiningAttempt[]) public miningHistory;
    mapping(address => uint256) public playerTotalSuccesses;

    event MiningAttemptMade(
        address indexed player,
        uint256 indexed nftId,
        uint256 randomNumber,
        bool success,
        uint256 roundId,
        uint256 timestamp
    );

    event MiningSuccess(
        address indexed player,
        uint256 indexed nftId,
        uint256 randomNumber,
        uint256 roundId,
        uint256 timestamp
    );

    constructor(address _gameManager, address _minerNFT, address _rewardManager) Ownable(msg.sender) {
        gameManager = GameManager(_gameManager);
        minerNFT = MinerNFT(_minerNFT);
        rewardManager = RewardManager(_rewardManager);
    }

    // 오프체인에서 NFT ID를 보내서 채굴 시도
    function attemptMining(uint256 nftId) external nonReentrant {
        require(gameManager.isRoundActive(), "No active round");
        require(minerNFT.ownerOf(nftId) == msg.sender, "Not NFT owner");

        GameManager.Round memory currentRound = gameManager.getCurrentRound();

        // NFT ID 기반 난수 생성
        uint256 randomNumber = _generateRandomNumber(nftId);

        // 채굴 성공 여부 확인
        bool success = _checkMiningSuccess(randomNumber, nftId, currentRound);

        // 통계 업데이트
        playerStats[msg.sender].totalAttempts++;
        playerStats[msg.sender].lastMiningTime = block.timestamp;

        // 채굴 기록 저장
        miningHistory[msg.sender].push(
            MiningAttempt({
                player: msg.sender,
                nftId: nftId,
                roundId: currentRound.roundId,
                randomNumber: randomNumber,
                success: success,
                timestamp: block.timestamp
            })
        );

        emit MiningAttemptMade(msg.sender, nftId, randomNumber, success, currentRound.roundId, block.timestamp);

        if (success) {
            playerStats[msg.sender].totalSuccesses++;
            playerTotalSuccesses[msg.sender]++;

            // RewardManager에서 보상 지급
            rewardManager.distributeBasicReward(msg.sender);

            emit MiningSuccess(msg.sender, nftId, randomNumber, currentRound.roundId, block.timestamp);

            // 완주 보너스 체크 (1000회 성공)
            if (playerTotalSuccesses[msg.sender] >= 1000) {
                rewardManager.distributeCompletionBonus(msg.sender);
            }
        }
    }

    function _generateRandomNumber(uint256 nftId) internal view returns (uint256) {
        // NFT ID와 블록 데이터를 조합한 난수 생성
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, nftId, gasleft())));
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
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
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

    function getRecentSuccesses(address player, uint256 count) external view returns (MiningAttempt[] memory) {
        MiningAttempt[] memory history = miningHistory[player];
        uint256 successCount = 0;
        uint256 totalCount = 0;

        // 최근 성공 사례만 필터링
        for (uint256 i = history.length; i > 0 && successCount < count; i--) {
            if (history[i - 1].success) {
                successCount++;
            }
            totalCount++;
        }

        MiningAttempt[] memory successes = new MiningAttempt[](successCount);
        uint256 successIndex = 0;

        for (uint256 i = history.length - totalCount; i < history.length && successIndex < successCount; i++) {
            if (history[i].success) {
                successes[successIndex] = history[i];
                successIndex++;
            }
        }

        return successes;
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
}

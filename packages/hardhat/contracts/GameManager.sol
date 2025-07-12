// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MinerNFT.sol";

contract GameManager is Ownable {
    enum PatternType {
        EVEN, // 짝수
        ODD, // 홀수
        PRIME, // 소수
        PI, // π 관련 (314 포함/배수)
        SQUARE // 완전제곱수
    }

    struct Round {
        uint256 roundId;
        uint256 startTime;
        PatternType pattern;
        uint256 minRange;
        uint256 maxRange;
        bool isActive;
    }

    uint256 public currentRoundId;
    MinerNFT public minerNFT;
    mapping(uint256 => Round) public rounds;
    bool public initialNFTsMinted; // 최초 NFT 민팅 여부

    event NewRoundStarted(
        uint256 indexed roundId,
        PatternType pattern,
        uint256 minRange,
        uint256 maxRange,
        uint256 startTime
    );

    event RoundEnded(uint256 indexed roundId, uint256 endTime);
    event StartingNFTsMinted(uint256 indexed roundId, address indexed recipient, uint256[3] tokenIds);

    constructor(address _minerNFT) Ownable(msg.sender) {
        minerNFT = MinerNFT(_minerNFT);
        initialNFTsMinted = false;
        _startNewRound();
    }

    // 초기화 함수 (배포 후 별도로 호출) - 최초 한번만
    function initializeWithNFTs() external onlyOwner {
        require(!initialNFTsMinted, "Initial NFTs already minted");
        _mintStartingNFTs();
        initialNFTsMinted = true;
    }

    function getCurrentRound() external view returns (Round memory) {
        return rounds[currentRoundId];
    }

    function isRoundActive() external view returns (bool) {
        if (currentRoundId == 0) return false;
        Round memory round = rounds[currentRoundId];
        return round.isActive;
    }

    function startNewRound() external onlyOwner {
        _startNewRound();
    }

    function _startNewRound() internal {
        // 이전 라운드 종료
        if (currentRoundId > 0) {
            rounds[currentRoundId].isActive = false;
            emit RoundEnded(currentRoundId, block.timestamp);
        }

        currentRoundId++;

        // 새 라운드 패턴 및 범위 설정
        (PatternType pattern, uint256 minRange, uint256 maxRange) = _generateRoundParameters();

        rounds[currentRoundId] = Round({
            roundId: currentRoundId,
            startTime: block.timestamp,
            pattern: pattern,
            minRange: minRange,
            maxRange: maxRange,
            isActive: true
        });

        emit NewRoundStarted(currentRoundId, pattern, minRange, maxRange, block.timestamp);
    }

    function _mintStartingNFTs() internal {
        // 3개의 다른 타입 NFT 민팅 (BalancedScan 3개)
        MinerNFT.MinerType[] memory minerTypes = new MinerNFT.MinerType[](3);
        minerTypes[0] = MinerNFT.MinerType.BALANCED_SCAN;
        minerTypes[1] = MinerNFT.MinerType.BALANCED_SCAN;
        minerTypes[2] = MinerNFT.MinerType.BALANCED_SCAN;

        // 배포자(owner)에게 NFT 민팅
        uint256[] memory tokenIds = minerNFT.batchMintMiners(owner(), minerTypes);

        uint256[3] memory nftIds;
        nftIds[0] = tokenIds[0];
        nftIds[1] = tokenIds[1];
        nftIds[2] = tokenIds[2];

        emit StartingNFTsMinted(currentRoundId, owner(), nftIds);
    }

    function _generateRoundParameters() internal view returns (PatternType, uint256, uint256) {
        // 의사 랜덤으로 패턴과 범위 생성
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, currentRoundId)));

        // 완전 랜덤한 패턴 선택
        PatternType pattern = PatternType(rand % 5);

        // 완전 랜덤한 범위 생성
        uint256 baseRange = 30000; // 최소 기준값
        uint256 maxRangeSpread = 50000; // 최대 범위 확산

        // 랜덤한 최소값 생성 (30,000 ~ 70,000)
        uint256 minRange = baseRange + (rand % (maxRangeSpread + 1));

        // 랜덤한 범위 크기 생성 (10,000 ~ 30,000)
        uint256 rangeSize = 10000 + ((rand >> 8) % 20001);
        uint256 maxRange = minRange + rangeSize;

        return (pattern, minRange, maxRange);
    }

    // 라운드 수동 종료 (관리자만)
    function endCurrentRound() external onlyOwner {
        require(rounds[currentRoundId].isActive, "Round not active");

        rounds[currentRoundId].isActive = false;
        emit RoundEnded(currentRoundId, block.timestamp);
    }

    function getRoundHistory(uint256 count) external view returns (Round[] memory) {
        uint256 startId = currentRoundId > count ? currentRoundId - count + 1 : 1;
        uint256 actualCount = currentRoundId - startId + 1;

        Round[] memory history = new Round[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            history[i] = rounds[startId + i];
        }

        return history;
    }
}

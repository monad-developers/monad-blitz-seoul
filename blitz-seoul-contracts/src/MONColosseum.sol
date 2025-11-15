// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./MONCharacterVault.sol";

interface IMONCharacterVault {
    function balanceOf(address owner) external view returns (uint256 balance);
    function settle(
        uint256 winnerNftId,
        uint256 loserNftId,
        uint256 amount
    ) external returns (uint256);
}

contract MONColosseum is Ownable, ReentrancyGuard {
    uint256 public constant MAX_COLOSSEUM_SIZE = 10;
    uint256 public constant MATCHING_TIMEOUT = 600;
    uint256 public nextColosseumId = 1;
    uint256 public nextRoundId = 1;
    IMONCharacter public immutable monCharacter;
    IMONCharacterVault public immutable monCharacterVault;

    address public gameMaster;

    mapping(uint256 => Colosseum) public colosseums; //콜로세움 아이디로 콜로세움 구조체 접근
    mapping(uint256 => bool) public colosseumExists; //콜로세움 아이디로 콜로세움 존재 유무 확인
    mapping(uint256 => uint256) public nftToColosseum; //nft 아이디로 어디 콜로세움에 있는지 확인
    mapping(uint256 => uint256) public nftToIndex; //index를 매핑해서 바로 조회 가능하게 설정

    // mapping(uint256 => Round) public rounds; //라운드 매핑
    mapping(uint256 => mapping(uint256 => Round)) public rounds;

    mapping(uint256 => BattleResult[]) public battlesByRound;

    //==========Event==========//
    event ColosseumCreated(uint256 indexed colosseumId, uint256 buyIn);
    event EnteredColosseum(uint256 indexed nftId, uint256 colosseumId);
    event ExitedColosseum(uint256 indexed nftId, uint256 colosseumId);
    event RoundStarted(
        uint256 indexed roundId,
        uint256 colosseumId,
        bytes32 roundSeed
    );
    event Shuffled(uint256 indexed roundId, uint256[] shuffled);

    //=========Struct==========//
    struct Colosseum {
        uint256 buyIn; // 판돈
        uint256 createdAt; // 콜로세움 만들어진 시간
        uint256[] activeNFTs; // 존재하는 MonCharacter 수
        bool isMatchingNow; // 매칭 진행중인지?
        uint256 matchingStartTime; // 매칭 요청 시작 시간
    }

    struct Round {
        uint256 colosseumId; // 라운드 진행된 콜로세움 아이디
        bytes32 seed; //사용된 시드값
        uint256 createdAt; // 라운드 시작타임
        uint256 playersCount; // 라운드 참가자 수
        uint256[] shuffledNFTs; // 해당 라운드에 사용될 NFT들의 섞인 순서
    }

    struct BattleResult {
        uint256 winnerNftId; // 승리 MonCharacter
        uint256 loserNftId; // 패배 MonCharacter
    }

    constructor(address _character, address _vault) Ownable(msg.sender) {
        require(
            _character != address(0) && _vault != address(0),
            "Invalid address"
        );
        monCharacter = IMONCharacter(_character);
        monCharacterVault = IMONCharacterVault(_vault);
    }

    //=========Modifier==========//

    modifier onlyGameMaster() {
        require(msg.sender == gameMaster, "Not Game Master");
        _;
    }

    //=========onlyOwner Function==========//
    function setGameMaster(address _gameMaster) external onlyOwner {
        require(_gameMaster != address(0), "Invalid address");
        gameMaster = _gameMaster;
    }

    //=========Internal Function==========//

    function _removeNFTFromColosseum(
        uint256 nftId,
        uint256 colosseumId
    ) internal {
        Colosseum storage colosseum = colosseums[colosseumId];

        uint256 index = nftToIndex[nftId];
        uint256[] storage nfts = colosseum.activeNFTs;

        // 1. Swap (배열의 마지막 요소를 제거될 요소 자리로 이동)
        uint256 lastTokenId = nfts[nfts.length - 1];
        if (nftId != lastTokenId) {
            nfts[index] = lastTokenId;
            nftToIndex[lastTokenId] = index;
        }

        // 2. Pop (배열의 크기를 줄이고 마지막 요소 제거)
        nfts.pop();

        // 3. Mapping 초기화
        delete nftToColosseum[nftId];
        delete nftToIndex[nftId];
    }

    function _copyArray(
        uint256[] storage arr
    ) internal view returns (uint256[] memory out) {
        uint256 len = arr.length;
        out = new uint256[](len);
        for (uint256 i = 0; i < len; i++) out[i] = arr[i];
    }

    function _shuffleMemory(
        uint256[] memory arr,
        bytes32 seed
    ) internal pure returns (uint256[] memory) {
        uint256 n = arr.length;
        if (n <= 1) return arr;
        for (uint256 i = n - 1; i > 0; i--) {
            uint256 r = uint256(keccak256(abi.encodePacked(seed, i)));
            uint256 j = r % (i + 1); // 0..i
            if (j != i) {
                (arr[i], arr[j]) = (arr[j], arr[i]);
            }
        }
        return arr;
    }

    //=========Function==========//
    // 새로운 콜로세움 생성 -> 판돈을 설정 가능
    function createNewColosseum(uint256 buyIn) external onlyGameMaster {
        uint256 colosseumId = nextColosseumId++;
        require(!colosseumExists[colosseumId], "Pool already exists");
        colosseumExists[colosseumId] = true;
        colosseums[colosseumId].createdAt = block.timestamp;
        colosseums[colosseumId].buyIn = buyIn;

        emit ColosseumCreated(colosseumId, buyIn);
    }

    // 콜로세움 입장
    function enterColosseum(uint256 nftId, uint256 colosseumId) external {
        require(colosseumExists[colosseumId], "Colosseum does not exist");
        Colosseum storage colosseum = colosseums[colosseumId];
        require(monCharacter.ownerOf(nftId) == msg.sender, "Not owner");
        require(nftToColosseum[nftId] == 0, "Already in");
        require(colosseum.activeNFTs.length < MAX_COLOSSEUM_SIZE, "Full");
        require(
            monCharacterVault.balanceOf(msg.sender) >= colosseum.buyIn,
            "Insufficient MON"
        );
        colosseum.activeNFTs.push(nftId);
        nftToIndex[nftId] = colosseum.activeNFTs.length - 1; //index 저장
        nftToColosseum[nftId] = colosseumId; // 어디 콜로세움인지 저장

        emit EnteredColosseum(nftId, colosseumId);
    }

    function exitColosseum(uint256 nftId, uint256 colosseumId) external {
        Colosseum storage colosseum = colosseums[colosseumId];

        // 매칭 중이면서 타임아웃이 발생했는지 확인
        bool isTimeout = colosseum.isMatchingNow &&
            (block.timestamp >= colosseum.matchingStartTime + MATCHING_TIMEOUT);

        // 조건 수정: 매칭 중이 아니거나 (False), 타임아웃이 발생했거나 (True)
        require(!colosseum.isMatchingNow || isTimeout, "Matching in progress");

        // 타임아웃으로 퇴장하는 경우, isMatchingNow를 해제해야 다음 라운드 요청 가능
        if (isTimeout) {
            colosseum.isMatchingNow = false;
        }

        _removeNFTFromColosseum(nftId, colosseumId);

        emit ExitedColosseum(nftId, colosseumId);
    }
    function triggerRound(uint256 colosseumId) external onlyGameMaster {
        Colosseum storage colosseum = colosseums[colosseumId];
        require(!colosseum.isMatchingNow, "Already requested");
        require(colosseum.activeNFTs.length >= 2, "Not enough");
        colosseum.isMatchingNow = true;
        colosseum.matchingStartTime = block.timestamp;
        // 라운드 정보 입력
        uint256 roundId = nextRoundId++;
        Round storage currentRound = rounds[colosseumId][roundId];
        currentRound.colosseumId = colosseumId;
        currentRound.createdAt = block.timestamp;
        currentRound.playersCount = colosseum.activeNFTs.length;
        // 시드 만들기
        bytes32 roundSeed = keccak256(
            abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                roundId,
                colosseumId
            )
        );

        currentRound.seed = roundSeed;
        emit RoundStarted(roundId, colosseumId, roundSeed);

        uint256[] memory activeNFTsCopy = _copyArray(colosseum.activeNFTs);
        // nft풀 섞기
        uint256[] memory shuffled = _shuffleMemory(activeNFTsCopy, roundSeed);
        currentRound.shuffledNFTs = shuffled;
        emit Shuffled(roundId, shuffled);
    }

    function submitBattleResults(
        uint256 colosseumId,
        uint256 roundId,
        uint256[] calldata winners,
        uint256[] calldata losers
    ) external onlyGameMaster nonReentrant {
        require(winners.length == losers.length, "Invalid results");
        Colosseum storage colosseum = colosseums[colosseumId];
        require(colosseum.isMatchingNow, "Not matching");
        require(
            rounds[colosseumId][roundId].colosseumId == colosseumId,
            "Invalid round"
        );

        uint256 buyIn = colosseum.buyIn;

        for (uint256 i = 0; i < winners.length; i++) {
            uint256 winnerId = winners[i];
            uint256 loserId = losers[i];

            battlesByRound[roundId].push(
                BattleResult({winnerNftId: winnerId, loserNftId: loserId})
            );

            uint256 remainingLoserBalance = monCharacterVault.settle(
                winnerId,
                loserId,
                buyIn
            );

            if (remainingLoserBalance < buyIn) {
                _removeNFTFromColosseum(loserId, colosseumId);

                emit ExitedColosseum(loserId, colosseumId);
            }
        }

        colosseum.isMatchingNow = false;
    }

    //=========Getter==========//
    function getActiveNFTs(
        uint256 colosseumId
    ) public view returns (uint256[] memory) {
        return colosseums[colosseumId].activeNFTs;
    }

    function getIsMatchingNow(uint256 colosseumId) public view returns (bool) {
        return colosseums[colosseumId].isMatchingNow;
    }
}

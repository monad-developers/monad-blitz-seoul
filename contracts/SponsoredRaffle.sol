// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import {GelatoVRFConsumerBase} from "./gelato/GelatoVRFConsumerBase.sol";

contract SponsoredRaffle is EIP712, Ownable, ReentrancyGuard, GelatoVRFConsumerBase {
    using ECDSA for bytes32;

    enum Phase { Enter, Locked, Requested, Drawn }

    Phase public phase;
    uint256 public raffleId;
    uint256 public winnersCount;

    address[] private _entrants;
    mapping(uint256 => mapping(address => bool)) public entered;
    mapping(address => uint256) public nonces;

    uint64 public lastRequestId;
    uint256 public randomWord;

    bytes32 private constant ENTRY_TYPEHASH =
        keccak256("Entry(address user,uint256 raffleId,uint256 nonce,uint256 deadline)");

    event Entered(address indexed user, uint256 indexed raffleId, uint256 totalEntrants);
    event Locked(uint256 indexed raffleId, uint256 totalEntrants);
    event VRFRequested(uint256 indexed raffleId, uint256 requestId);
    event WinnersDrawn(uint256 indexed raffleId, address[] winners);
    event NewRound(uint256 indexed raffleId, uint256 winnersCount);

    constructor(
        address owner_,
        address operator_, // dedicated msg.sender
        uint256 winnersCount_
    ) EIP712("SponsoredRaffle", "1") Ownable(owner_) GelatoVRFConsumerBase(operator_) {
        winnersCount = winnersCount_;
        raffleId = 1;
        phase = Phase.Enter;
        emit NewRound(raffleId, winnersCount);
    }

    function entrantsCount() external view returns (uint256) { return _entrants.length; }
    function entrantsAll() external view returns (address[] memory) { return _entrants; }


    function enterWithSig(address user, uint256 nonce, uint256 deadline, bytes calldata signature) external nonReentrant {
        require(phase == Phase.Enter, "RAFFLE: not enter phase");
        require(block.timestamp <= deadline, "RAFFLE: expired");
        require(!entered[raffleId][user], "RAFFLE: already entered");
        require(nonce == nonces[user], "RAFFLE: bad nonce");

        bytes32 structHash = keccak256(abi.encode(ENTRY_TYPEHASH, user, raffleId, nonce, deadline));
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == user, "RAFFLE: bad sig");

        unchecked { nonces[user] = nonce + 1; }
        entered[raffleId][user] = true;
        _entrants.push(user);
        emit Entered(user, raffleId, _entrants.length);
    }

    function lock() external onlyOwner {
        require(phase == Phase.Enter, "phase");
        phase = Phase.Locked;
        emit Locked(raffleId, _entrants.length);
    }

    function requestRandomness(bytes memory data) external onlyOwner {
        require(phase == Phase.Locked, "RAFFLE: must be locked");
        phase = Phase.Requested;
        lastRequestId = _requestRandomness(data);
        emit VRFRequested(raffleId, lastRequestId);
    }

    function _fulfillRandomness(
        bytes32 randomness,
        uint64 requestId,
        bytes memory /*data*/
    ) internal override {
        require(phase == Phase.Requested, "RAFFLE: wrong phase");
        require(_entrants.length >= winnersCount && _entrants.length > 0, "RAFFLE: not enough entrants");
        randomWord = uint256(randomness);

        uint256 n = _entrants.length;
        bool[] memory taken = new bool[](n);
        address[] memory winners = new address[](winnersCount);
        for (uint256 i = 0; i < winnersCount; i++) {
            uint256 idx = uint256(keccak256(abi.encode(randomWord, i))) % n;
            while (taken[idx]) { idx = (idx + 1) % n; }
            taken[idx] = true;
            winners[i] = _entrants[idx];
        }
        phase = Phase.Drawn;
        emit WinnersDrawn(raffleId, winners);
    }

    function newRound(uint256 newWinnersCount) external onlyOwner {
        require(phase == Phase.Drawn || phase == Phase.Enter, "phase");
        delete _entrants;
        raffleId += 1;
        if (newWinnersCount > 0) winnersCount = newWinnersCount;
        phase = Phase.Enter;
        emit NewRound(raffleId, winnersCount);
    }
}
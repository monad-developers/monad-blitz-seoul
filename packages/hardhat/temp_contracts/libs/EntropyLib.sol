/* contracts/libs/EntropyLib.sol */
pragma solidity ^0.8.23;

interface IEntropyConsumer {
    function requestRandom(bytes32 commitment) external payable returns (uint64);
    function revealRandom(uint64 seq, bytes32 userRand, bytes32 providerRand) external returns (bytes32);
}

bytes32 constant VRF_ROLE = keccak256("VRF_ROLE");

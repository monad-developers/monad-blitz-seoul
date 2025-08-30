// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGelatoVRFConsumer {
    function fulfillRandomness(uint256 requestId, uint256 randomness) external;
}

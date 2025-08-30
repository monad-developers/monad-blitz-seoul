// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGelatoVRF {
    function requestRandomness() external returns (uint256 requestId);
}

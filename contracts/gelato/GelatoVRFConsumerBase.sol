// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGelatoVRF {
    function requestRandomness() external returns (uint256 requestId);
}

abstract contract GelatoVRFConsumerBase {
    address public immutable operator;

    event RandomnessRequested(uint256 indexed requestId);

    constructor(address _operator) {
        operator = _operator;
    }

    function _requestRandomness(bytes memory data) internal returns (uint64 requestId) {
        // 실제 Gelato VRF 컨트랙트와 연동 시, 이 부분은 Gelato VRF에 맞게 구현 필요
        // 예시: IGelatoVRF(operator).requestRandomness();
        // 아래는 예시용 placeholder
        requestId = uint64(IGelatoVRF(operator).requestRandomness());
        emit RandomnessRequested(requestId);
    }

    function fulfillRandomness(uint256 requestId, uint256 randomness) external virtual {
        require(msg.sender == operator, "Only operator");
        _fulfillRandomness(bytes32(randomness), uint64(requestId), "");
    }

    function _fulfillRandomness(
        bytes32 randomness,
        uint64 requestId,
        bytes memory data
    ) internal virtual;
}

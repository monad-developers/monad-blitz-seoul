//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

struct SwapOrder {
    address maker;
    address taker;
    address tokenM;
    address tokenT;
    uint256 amountM;
    uint256 amountT;
    uint256 expiry;
    uint256 nonce;
}

contract InstantSwap is EIP712 {
    using ECDSA for bytes32;

    mapping(bytes32 => bool) public usedNonces;

    bytes32 public constant SWAP_ORDER_TYPEHASH = keccak256(
        "SwapOrder(address maker,address taker,address tokenM,address tokenT,uint256 amountM,uint256 amountT,uint256 expiry,uint256 nonce)"
    );

    event Swap(
        address indexed maker, address indexed taker,
        address tokenM, address tokenT,
        uint256 amountM, uint256 amountT
    );

    constructor() EIP712("InstantSwap", "1") {}

    function instantSwap(SwapOrder memory order, bytes memory signature) external {
        // 1) order.taker == msg.sender
        require(order.taker == msg.sender, "Taker chk");
        // 2) order.maker == signature 작성자인지
        require(verifySignature(order, signature), "Maker chk");
        // 3) expiry chk
        require(block.timestamp <= order.expiry, "Order expired");
        // 4) nonce chk
        bytes32 nonceHash = keccak256(abi.encodePacked(order.maker, order.nonce));
        require(!usedNonces[nonceHash], "nonce already used");
        usedNonces[nonceHash] = true;

        // 5) transfer
        require(IERC20(order.tokenM).transferFrom(order.maker, order.taker, order.amountM), "TokenM transfer failed");
        require(IERC20(order.tokenT).transferFrom(order.taker, order.maker, order.amountT), "TokenT transfer failed");
        
        emit Swap(order.maker, order.taker, order.tokenM, order.tokenT, order.amountM, order.amountT);
    }

    function verifySignature(SwapOrder memory order, bytes memory signature) internal view returns (bool) {
        bytes32 structHash = keccak256(
            abi.encode(
                SWAP_ORDER_TYPEHASH,
                order.maker,
                order.taker,
                order.tokenM,
                order.tokenT,
                order.amountM,
                order.amountT,
                order.expiry,
                order.nonce
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        return signer == order.maker;
    }
}

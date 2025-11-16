// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Chainlink Any2EVM client types (simplified, no external deps).
library Client {
    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    struct Any2EVMMessage {
        bytes32 messageId;
        uint64 sourceChainSelector;
        bytes sender; // abi.encode(sourceRouterAddress) for EVM lanes
        bytes data;   // abi.encode(address[] recipients, uint256 amountPerRecipient)
        EVMTokenAmount[] destTokenAmounts;
        address feeToken;
        uint256 feeTokenAmount;
    }
}

/// @dev Minimal ERC20 interface.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

/// @title CCIP USDC Receiver (Destination chain)
/// @notice Receives CCIP messages, verifies origin/token, decodes recipients and
///         distributes bridged USDC evenly.
contract Receiver {
    error NotAuthorizedRouter(address caller);
    error InvalidSourceChain(uint64 selector);
    error InvalidSourceSender(address sender);
    error InvalidToken(address token);
    error AmountMismatch(uint256 bridged, uint256 expected);
    error TransferFailed(address to, uint256 amount);

    event Received(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address indexed token,
        uint256 totalAmount,
        uint256 recipientsCount
    );

    event TransferOut(address indexed token, address indexed to, uint256 amount);

    address public immutable router;
    uint64 public immutable sourceChainSelector;
    address public immutable sourceSender; // Router on source chain
    address public immutable usdc;

    constructor(address _router, uint64 _sourceChainSelector, address _sourceSender, address _usdc) {
        router = _router;
        sourceChainSelector = _sourceChainSelector;
        sourceSender = _sourceSender;
        usdc = _usdc;
    }

    /// @notice CCIP entrypoint. Validates origin + token and pays out evenly.
    function ccipReceive(Client.Any2EVMMessage calldata message) external {
        if (msg.sender != router) revert NotAuthorizedRouter(msg.sender);
        if (message.sourceChainSelector != sourceChainSelector) {
            revert InvalidSourceChain(message.sourceChainSelector);
        }

        address decodedSender = abi.decode(message.sender, (address));
        if (decodedSender != sourceSender) revert InvalidSourceSender(decodedSender);

        // Expect exactly one token bridged: USDC
        if (message.destTokenAmounts.length != 1) revert InvalidToken(address(0));
        Client.EVMTokenAmount calldata amt = message.destTokenAmounts[0];
        if (amt.token != usdc) revert InvalidToken(amt.token);

        (address[] memory recipients, uint256 amountPerRecipient) =
            abi.decode(message.data, (address[], uint256));
        uint256 expectedTotal = amountPerRecipient * recipients.length;
        if (amt.amount != expectedTotal) revert AmountMismatch(amt.amount, expectedTotal);

        _distribute(usdc, recipients, amountPerRecipient);

        emit Received(message.messageId, message.sourceChainSelector, usdc, amt.amount, recipients.length);
    }

    function _distribute(address token, address[] memory recipients, uint256 amountPerRecipient) internal {
        for (uint256 i = 0; i < recipients.length; i++) {
            _safeTransfer(token, recipients[i], amountPerRecipient);
        }
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if (!ok || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed(to, amount);
        }
        emit TransferOut(token, to, amount);
    }
}

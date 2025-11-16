// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Chainlink CCIP Client library structures
library Client {
    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    struct EVM2AnyMessage {
        bytes receiver;
        bytes data;
        EVMTokenAmount[] tokenAmounts;
        address feeToken;
        bytes extraArgs;
    }
}

/// @dev Chainlink CCIP Router interface
interface IRouterClient {
    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external payable returns (bytes32 messageId);

    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) external view returns (uint256 fee);

    function getSupportedTokens(uint64 chainSelector) external view returns (address[] memory);

    function isChainSupported(uint64 chainSelector) external view returns (bool);
}

/// @dev ERC20 interface
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @title TokenSender
/// @notice Monad에서 Base Sepolia로 ERC-20 토큰을 CCIP를 통해 전송하는 컨트랙트
/// @dev Chainlink CCIP 문서를 참고하여 구현
/// @dev 토큰은 CCIP Router가 자동으로 Token Pool을 통해 lockOrBurn 처리합니다
contract TokenSender {
    /// @notice Chainlink CCIP Router 주소
    address public immutable ccipRouter;

    /// @notice 목적지 체인 셀렉터 (Base Sepolia)
    uint64 public immutable destinationChainSelector;

    /// @notice CCIP 수수료 지불용 토큰 (address(0) = native, LINK/WMON 주소 = 해당 토큰)
    address public feeToken;

    /// @notice 컨트랙트 소유자
    address public owner;

    /// @notice 허용된 체인 셀렉터 매핑
    mapping(uint64 => bool) public allowlistedChains;

    error NotOwner();
    error InvalidAmount();
    error InsufficientBalance(uint256 required, uint256 available);
    error InsufficientAllowance(uint256 required, uint256 available);
    error TransferFailed();
    error ChainNotAllowlisted(uint64 chainSelector);
    error CCIPSendFailed();

    event TokensTransferred(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver,
        address token,
        uint256 amount
    );
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event FeeTokenUpdated(address indexed oldFeeToken, address indexed newFeeToken);
    event ChainAllowlisted(uint64 indexed chainSelector, bool allowed);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAllowlistedChain(uint64 _destinationChainSelector) {
        if (!allowlistedChains[_destinationChainSelector]) {
            revert ChainNotAllowlisted(_destinationChainSelector);
        }
        _;
    }

    constructor(
        address _ccipRouter,
        uint64 _destinationChainSelector,
        address _feeToken
    ) {
        if (_ccipRouter == address(0)) revert InvalidAmount();

        ccipRouter = _ccipRouter;
        destinationChainSelector = _destinationChainSelector;
        feeToken = _feeToken; // address(0) = native, 또는 LINK/WMON 주소
        owner = msg.sender;

        // 기본적으로 목적지 체인을 allowlist에 추가
        allowlistedChains[_destinationChainSelector] = true;
    }

    /// @notice 소유자 변경
    /// @param newOwner 새로운 소유자 주소
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAmount();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /// @notice CCIP 수수료 지불용 토큰 설정
    /// @param newFeeToken 새로운 feeToken 주소 (address(0) = native, LINK/WMON 주소 = 해당 토큰)
    function setFeeToken(address newFeeToken) external onlyOwner {
        address oldFeeToken = feeToken;
        feeToken = newFeeToken;
        emit FeeTokenUpdated(oldFeeToken, newFeeToken);
    }

    /// @notice 체인 allowlist 설정
    /// @param _chainSelector 체인 셀렉터
    /// @param allowed 허용 여부
    function allowlistChain(uint64 _chainSelector, bool allowed) external onlyOwner {
        allowlistedChains[_chainSelector] = allowed;
        emit ChainAllowlisted(_chainSelector, allowed);
    }

    /// @notice 메시지만 전송 (토큰 전송 없음)
    /// @param _receiver 목적지 Receiver 컨트랙트 주소
    /// @return messageId CCIP 메시지 ID
    function transferMessage(
        address _receiver
    ) external payable onlyAllowlistedChain(destinationChainSelector) returns (bytes32 messageId) {
        if (_receiver == address(0)) revert InvalidAmount();
        Client.EVM2AnyMessage memory message = _buildCCIPMessage(_receiver, address(0), 0);
        messageId = _dispatchMessage(message, _receiver, address(0), 0);
    }

    function transferTokens1(
        address _token,
        address _receiver,
        uint256 _amount
    ) external  onlyAllowlistedChain(destinationChainSelector)  {
        if (_receiver == address(0) || _token == address(0) || _amount == 0) revert InvalidAmount();

        // 컨트랙트의 토큰 잔액 확인
        uint256 balance = IERC20(_token).balanceOf(address(this));
        if (balance < _amount) {
            revert InsufficientBalance(_amount, balance);
        }

        // CCIP Router에 토큰 approve
        uint256 allowance = IERC20(_token).allowance(address(this), ccipRouter);
        if (allowance < _amount) {
            bool success = IERC20(_token).approve(ccipRouter, type(uint256).max);
            if (!success) revert TransferFailed();
        }

       
    }
    function transferTokens2(
        address _token,
        address _receiver,
        uint256 _amount
    ) external payable onlyAllowlistedChain(destinationChainSelector) returns (bytes32 messageId) {
        

        // CCIP 메시지 구성
        Client.EVM2AnyMessage memory message = _buildCCIPMessage(_receiver, _token, _amount);

        messageId = _dispatchMessage(message, _receiver, _token, _amount);
    }

    /// @notice CCIP 전송 수수료 조회
    /// @param _token 전송할 토큰 주소
    /// @param _receiver 목적지 Receiver 컨트랙트 주소
    /// @param _amount 전송할 토큰 수량
    /// @return fee 필요한 CCIP 수수료
    function getTransferFee(
        address _token,
        address _receiver,
        uint256 _amount
    ) external view returns (uint256 fee) {
        Client.EVM2AnyMessage memory message = _buildCCIPMessage(_receiver, _token, _amount);
        IRouterClient router = IRouterClient(ccipRouter);
        fee = router.getFee(destinationChainSelector, message);
    }

    /// @dev CCIP 메시지 구성 (내부 함수)
    function _buildCCIPMessage(
        address _receiver,
        address _token,
        uint256 _amount
    ) internal view returns (Client.EVM2AnyMessage memory) {
        // amount가 0이면 tokenAmounts를 비움 (메시지만 전송)
        Client.EVMTokenAmount[] memory tokenAmounts;
        if (_amount > 0 && _token != address(0)) {
            tokenAmounts = new Client.EVMTokenAmount[](1);
            tokenAmounts[0] = Client.EVMTokenAmount({token: _token, amount: _amount});
        } else {
            tokenAmounts = new Client.EVMTokenAmount[](0);
        }

        // extraArgs 설정 (gasLimit = 0, 토큰 전송만 수행)
        bytes memory extraArgs = "";

        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: "",
            tokenAmounts: tokenAmounts,
            feeToken: feeToken,
            extraArgs: extraArgs
        });
    }

    function _dispatchMessage(
        Client.EVM2AnyMessage memory message,
        address _receiver,
        address _token,
        uint256 _amount
    ) internal returns (bytes32 messageId) {
        IRouterClient router = IRouterClient(ccipRouter);
        uint256 fee = router.getFee(destinationChainSelector, message);

        if (feeToken == address(0)) {
            if (msg.value < fee) {
                revert InsufficientBalance(fee, msg.value);
            }
            messageId = router.ccipSend{value: fee}(destinationChainSelector, message);
        } else {
            uint256 feeTokenBalance = IERC20(feeToken).balanceOf(address(this));
            if (feeTokenBalance < fee) {
                revert InsufficientBalance(fee, feeTokenBalance);
            }

            uint256 feeTokenAllowance = IERC20(feeToken).allowance(address(this), ccipRouter);
            if (feeTokenAllowance < fee) {
                bool success = IERC20(feeToken).approve(ccipRouter, type(uint256).max);
                if (!success) revert TransferFailed();
            }

            messageId = router.ccipSend(destinationChainSelector, message);
        }

        if (messageId == bytes32(0)) revert CCIPSendFailed();

        emit TokensTransferred(messageId, destinationChainSelector, _receiver, _token, _amount);
    }

    /// @notice 컨트랙트의 토큰 잔액 조회
    /// @param _token 토큰 주소
    /// @return balance 토큰 잔액
    function getTokenBalance(address _token) external view returns (uint256 balance) {
        balance = IERC20(_token).balanceOf(address(this));
    }

    /// @notice 컨트랙트의 feeToken 잔액 조회
    /// @return balance feeToken 잔액
    function getFeeTokenBalance() external view returns (uint256 balance) {
        if (feeToken == address(0)) {
            balance = address(this).balance;
        } else {
            balance = IERC20(feeToken).balanceOf(address(this));
        }
    }

    /// @notice 토큰을 컨트랙트에 입금
    /// @param _token 토큰 주소
    /// @param _amount 입금할 토큰 금액
    /// @dev 이 컨트랙트를 호출하는 주소가 토큰을 approve해야 합니다
    function depositToken(address _token, uint256 _amount) external {
        bool success = IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TransferFailed();
    }

    /// @notice 소유자가 토큰을 인출
    /// @param _token 토큰 주소
    /// @param _amount 인출할 토큰 금액
    /// @param _to 인출받을 주소
    function withdrawToken(address _token, uint256 _amount, address _to) external onlyOwner {
        if (_to == address(0)) revert InvalidAmount();
        bool success = IERC20(_token).transfer(_to, _amount);
        if (!success) revert TransferFailed();
    }

    /// @notice 소유자가 native token을 인출
    /// @param _amount 인출할 금액
    /// @param _to 인출받을 주소
    function withdrawNative(uint256 _amount, address _to) external onlyOwner {
        if (_to == address(0)) revert InvalidAmount();
        (bool success, ) = _to.call{value: _amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice 컨트랙트가 native token을 받을 수 있도록
    receive() external payable {}
}

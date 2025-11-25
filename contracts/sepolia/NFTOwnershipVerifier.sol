// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTOwnershipVerifier
 * @notice Sepolia에서 NFT 소유권을 검증하고 CCIP를 통해 Monad로 attestation을 전송하는 컨트랙트
 * @dev ERC721 NFT 소유 여부를 확인하고, 소유권 증명을 크로스체인으로 전송
 */
contract NFTOwnershipVerifier is Ownable {
    IRouterClient public immutable ccipRouter;

    /// @notice Attestation 구조체
    /// @dev 온체인에 저장되는 소유권 증명 데이터
    struct Attestation {
        address nftContract;        // 검증된 NFT 컨트랙트 주소
        uint256 tokenId;            // 검증된 토큰 ID
        address owner;              // NFT 소유자 주소
        uint256 timestamp;          // Attestation 생성 시간
        uint256 blockNumber;        // Attestation 생성 블록
        uint64 sourceChainSelector; // 소스 체인 selector (Sepolia)
        bytes32 attestationId;      // 고유 attestation ID
    }

    /// @notice Attestation ID로 attestation 데이터 조회
    mapping(bytes32 => Attestation) public attestations;

    /// @notice 사용자별 nonce (고유 ID 생성용)
    mapping(address => uint256) public nonces;

    /// @notice 지원하는 NFT 컬렉션 화이트리스트
    mapping(address => bool) public supportedNFTs;

    /// @notice Sepolia Chain Selector (고정값)
    uint64 public constant SEPOLIA_CHAIN_SELECTOR = 16015286601757825753;

    /// @notice Attestation 생성 이벤트
    event AttestationCreated(
        bytes32 indexed attestationId,
        address indexed owner,
        address nftContract,
        uint256 tokenId
    );

    /// @notice CCIP를 통한 Attestation 전송 이벤트
    event AttestationBridged(
        bytes32 indexed attestationId,
        uint64 indexed destinationChain,
        address receiver,
        bytes32 messageId
    );

    /// @notice NFT 컬렉션 지원 추가 이벤트
    event NFTSupportAdded(address indexed nftContract);

    /// @notice NFT 컬렉션 지원 제거 이벤트
    event NFTSupportRemoved(address indexed nftContract);

    /// @notice 생성자
    /// @param _ccipRouter CCIP Router 주소
    constructor(address _ccipRouter) Ownable(msg.sender) {
        require(_ccipRouter != address(0), "Invalid router address");
        ccipRouter = IRouterClient(_ccipRouter);
    }

    /**
     * @notice 지원하는 NFT 컬렉션 추가
     * @param nftContract 추가할 NFT 컨트랙트 주소
     */
    function addSupportedNFT(address nftContract) external onlyOwner {
        require(nftContract != address(0), "Invalid NFT address");
        require(!supportedNFTs[nftContract], "NFT already supported");

        supportedNFTs[nftContract] = true;
        emit NFTSupportAdded(nftContract);
    }

    /**
     * @notice 지원하는 NFT 컬렉션 제거
     * @param nftContract 제거할 NFT 컨트랙트 주소
     */
    function removeSupportedNFT(address nftContract) external onlyOwner {
        require(supportedNFTs[nftContract], "NFT not supported");

        supportedNFTs[nftContract] = false;
        emit NFTSupportRemoved(nftContract);
    }

    /**
     * @notice NFT 소유권 attestation 생성
     * @dev NFT 소유 여부를 확인하고 attestation을 생성하여 온체인에 저장
     * @param nftContract 검증할 NFT 컨트랙트 주소
     * @param tokenId 검증할 토큰 ID
     * @return attestationId 생성된 attestation의 고유 ID
     */
    function createAttestation(
        address nftContract,
        uint256 tokenId
    ) external returns (bytes32 attestationId) {
        require(supportedNFTs[nftContract], "NFT not supported");

        // ERC721 소유권 검증
        IERC721 nft = IERC721(nftContract);
        address nftOwner = nft.ownerOf(tokenId);
        require(nftOwner == msg.sender, "Not the owner");

        // 고유 attestation ID 생성
        attestationId = keccak256(
            abi.encodePacked(
                msg.sender,
                nftContract,
                tokenId,
                nonces[msg.sender],
                block.timestamp
            )
        );

        // Nonce 증가
        nonces[msg.sender]++;

        // Attestation 저장
        attestations[attestationId] = Attestation({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: msg.sender,
            timestamp: block.timestamp,
            blockNumber: block.number,
            sourceChainSelector: SEPOLIA_CHAIN_SELECTOR,
            attestationId: attestationId
        });

        emit AttestationCreated(attestationId, msg.sender, nftContract, tokenId);

        return attestationId;
    }

    /**
     * @notice CCIP를 통해 attestation을 Monad로 전송
     * @dev NFT 소유권을 재검증하고 CCIP 메시지 전송
     * @param attestationId 전송할 attestation ID
     * @param destinationChainSelector 목적지 체인 selector
     * @param receiver 목적지 체인의 CCIPReceiver 주소
     * @return messageId CCIP 메시지 ID
     */
    function bridgeAttestation(
        bytes32 attestationId,
        uint64 destinationChainSelector,
        address receiver
    ) external payable returns (bytes32 messageId) {
        Attestation memory attestation = attestations[attestationId];
        require(attestation.owner == msg.sender, "Not attestation owner");

        // NFT 소유권 재검증 (전송 후 브릿지 시도 방지)
        IERC721 nft = IERC721(attestation.nftContract);
        address currentOwner = nft.ownerOf(attestation.tokenId);
        require(currentOwner == msg.sender, "No longer the owner");

        // CCIP 메시지 데이터 인코딩
        bytes memory data = abi.encode(
            attestation.nftContract,
            attestation.tokenId,
            attestation.owner,
            attestation.timestamp,
            attestation.blockNumber,
            attestation.sourceChainSelector,
            attestationId
        );

        // CCIP 메시지 구성
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0), // 토큰 전송 없음
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000}) // 가스 제한
            ),
            feeToken: address(0) // Native token으로 수수료 지불
        });

        // 수수료 계산
        uint256 fee = ccipRouter.getFee(destinationChainSelector, message);
        require(msg.value >= fee, "Insufficient fee");

        // CCIP 메시지 전송
        messageId = ccipRouter.ccipSend{value: fee}(
            destinationChainSelector,
            message
        );

        emit AttestationBridged(attestationId, destinationChainSelector, receiver, messageId);

        // 잔액 환불
        if (msg.value > fee) {
            (bool success, ) = msg.sender.call{value: msg.value - fee}("");
            require(success, "Refund failed");
        }

        return messageId;
    }

    /**
     * @notice CCIP 전송 수수료 견적
     * @param attestationId 전송할 attestation ID
     * @param destinationChainSelector 목적지 체인 selector
     * @param receiver 목적지 체인의 CCIPReceiver 주소
     * @return fee 필요한 수수료 (wei)
     */
    function estimateFee(
        bytes32 attestationId,
        uint64 destinationChainSelector,
        address receiver
    ) external view returns (uint256 fee) {
        Attestation memory attestation = attestations[attestationId];
        require(attestation.owner != address(0), "Attestation not found");

        // 메시지 데이터 인코딩
        bytes memory data = abi.encode(
            attestation.nftContract,
            attestation.tokenId,
            attestation.owner,
            attestation.timestamp,
            attestation.blockNumber,
            attestation.sourceChainSelector,
            attestationId
        );

        // CCIP 메시지 구성
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            feeToken: address(0)
        });

        // 수수료 계산 및 반환
        fee = ccipRouter.getFee(destinationChainSelector, message);
        return fee;
    }

    /**
     * @notice Attestation 조회
     * @param attestationId 조회할 attestation ID
     * @return Attestation 데이터
     */
    function getAttestation(bytes32 attestationId)
        external
        view
        returns (Attestation memory)
    {
        return attestations[attestationId];
    }

    /**
     * @notice NFT 지원 여부 확인
     * @param nftContract 확인할 NFT 컨트랙트 주소
     * @return 지원 여부
     */
    function isNFTSupported(address nftContract) external view returns (bool) {
        return supportedNFTs[nftContract];
    }

    /**
     * @notice 컨트랙트에 갇힌 ETH 회수 (긴급용)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice ETH 수신 허용
     */
    receive() external payable {}
}

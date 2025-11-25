// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAny2EVMMessageReceiver} from "@chainlink/contracts-ccip/contracts/interfaces/IAny2EVMMessageReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title MonadCCIPReceiver
 * @notice Monad에서 CCIP를 통해 Sepolia로부터 NFT 소유권 attestation을 수신하는 컨트랙트
 * @dev IAny2EVMMessageReceiver를 구현하여 크로스체인 메시지 수신 처리
 */
contract MonadCCIPReceiver is IAny2EVMMessageReceiver, IERC165, Ownable {

    /// @notice CCIP Router 주소
    address public immutable ccipRouter;

    /// @notice 수신된 Attestation 구조체
    /// @dev Sepolia에서 전송된 attestation 데이터
    struct ReceivedAttestation {
        address nftContract;        // Sepolia NFT 컨트랙트 주소
        uint256 tokenId;            // NFT 토큰 ID
        address owner;              // NFT 소유자 주소
        uint256 timestamp;          // Attestation 생성 시간
        uint256 blockNumber;        // Attestation 생성 블록
        uint64 sourceChainSelector; // 소스 체인 selector
        bytes32 attestationId;      // 고유 attestation ID
        uint256 receivedAt;         // Monad에서 수신한 시간
        bool used;                  // 사용 여부
    }

    /// @notice Attestation ID로 수신된 attestation 조회
    mapping(bytes32 => ReceivedAttestation) public receivedAttestations;

    /// @notice 사용자 주소로 최신 attestation ID 조회
    mapping(address => bytes32) public userToLatestAttestation;

    /// @notice 체인별 신뢰할 수 있는 Verifier 주소
    /// @dev chainSelector => verifier address => trusted
    mapping(uint64 => mapping(address => bool)) public trustedVerifiers;

    /// @notice Attestation 최대 유효 기간 (7일)
    uint256 public constant MAX_ATTESTATION_AGE = 7 days;

    /// @notice MinecraftPFP 컨트랙트 주소 (attestation 사용 권한)
    address public minecraftPFP;

    /// @notice Attestation 수신 이벤트
    event AttestationReceived(
        bytes32 indexed attestationId,
        address indexed owner,
        uint64 sourceChain,
        bytes32 ccipMessageId
    );

    /// @notice Attestation 사용 이벤트
    event AttestationUsed(
        bytes32 indexed attestationId,
        address indexed user
    );

    /// @notice 신뢰할 수 있는 Verifier 설정 이벤트
    event TrustedVerifierSet(
        uint64 indexed sourceChainSelector,
        address indexed verifier,
        bool trusted
    );

    /// @notice MinecraftPFP 주소 설정 이벤트
    event MinecraftPFPSet(address indexed minecraftPFP);

    /// @notice 에러: 유효하지 않은 Router
    error InvalidRouter(address router);

    /// @notice 생성자
    /// @param _ccipRouter CCIP Router 주소
    constructor(address _ccipRouter) Ownable(msg.sender) {
        require(_ccipRouter != address(0), "Invalid router address");
        ccipRouter = _ccipRouter;
    }

    /**
     * @notice MinecraftPFP 컨트랙트 주소 설정
     * @param _minecraftPFP MinecraftPFP 컨트랙트 주소
     */
    function setMinecraftPFP(address _minecraftPFP) external onlyOwner {
        require(_minecraftPFP != address(0), "Invalid address");
        minecraftPFP = _minecraftPFP;
        emit MinecraftPFPSet(_minecraftPFP);
    }

    /**
     * @notice 신뢰할 수 있는 Verifier 설정
     * @dev 특정 체인의 Verifier를 화이트리스트에 추가/제거
     * @param sourceChainSelector 소스 체인 selector
     * @param verifier Verifier 컨트랙트 주소
     * @param trusted 신뢰 여부
     */
    function setTrustedVerifier(
        uint64 sourceChainSelector,
        address verifier,
        bool trusted
    ) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        trustedVerifiers[sourceChainSelector][verifier] = trusted;
        emit TrustedVerifierSet(sourceChainSelector, verifier, trusted);
    }

    /**
     * @notice CCIP 메시지 수신 (IAny2EVMMessageReceiver 구현)
     * @dev CCIP Router로부터만 호출 가능
     * @param message CCIP로부터 수신한 메시지
     */
    function ccipReceive(
        Client.Any2EVMMessage calldata message
    ) external override onlyRouter {
        _ccipReceive(message);
    }

    /**
     * @notice CCIP 메시지 수신 처리 (내부 함수)
     * @param message CCIP로부터 수신한 메시지
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal {
        // 송신자 주소 디코딩
        address sender = abi.decode(message.sender, (address));

        // 신뢰할 수 있는 Verifier인지 확인
        require(
            trustedVerifiers[message.sourceChainSelector][sender],
            "Untrusted verifier"
        );

        // Attestation 데이터 디코딩
        (
            address nftContract,
            uint256 tokenId,
            address owner,
            uint256 timestamp,
            uint256 blockNumber,
            uint64 sourceChainSelector,
            bytes32 attestationId
        ) = abi.decode(
            message.data,
            (address, uint256, address, uint256, uint256, uint64, bytes32)
        );

        // 중복 attestation 체크
        require(
            receivedAttestations[attestationId].owner == address(0),
            "Attestation already received"
        );

        // Attestation 저장
        receivedAttestations[attestationId] = ReceivedAttestation({
            nftContract: nftContract,
            tokenId: tokenId,
            owner: owner,
            timestamp: timestamp,
            blockNumber: blockNumber,
            sourceChainSelector: sourceChainSelector,
            attestationId: attestationId,
            receivedAt: block.timestamp,
            used: false
        });

        // 사용자의 최신 attestation 업데이트
        userToLatestAttestation[owner] = attestationId;

        emit AttestationReceived(
            attestationId,
            owner,
            sourceChainSelector,
            message.messageId
        );
    }

    /**
     * @notice IERC165 인터페이스 지원 여부
     * @param interfaceId 확인할 인터페이스 ID
     * @return 지원 여부
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public pure override returns (bool) {
        return interfaceId == type(IAny2EVMMessageReceiver).interfaceId ||
               interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @notice Router 주소 조회
     * @return CCIP Router 주소
     */
    function getRouter() public view returns (address) {
        return ccipRouter;
    }

    /**
     * @notice 사용자의 유효한 attestation 존재 여부 확인
     * @dev MinecraftPFP 컨트랙트에서 호출하여 특수 trait 부여 여부 결정
     * @param user 확인할 사용자 주소
     * @return 유효한 attestation 존재 여부
     */
    function hasValidAttestation(address user) external view returns (bool) {
        bytes32 attestationId = userToLatestAttestation[user];

        // Attestation이 없으면 false
        if (attestationId == bytes32(0)) {
            return false;
        }

        ReceivedAttestation memory attestation = receivedAttestations[attestationId];

        // Owner가 일치하지 않으면 false
        if (attestation.owner != user) {
            return false;
        }

        // 이미 사용되었으면 false
        if (attestation.used) {
            return false;
        }

        // 만료되었으면 false (7일)
        if (block.timestamp > attestation.receivedAt + MAX_ATTESTATION_AGE) {
            return false;
        }

        return true;
    }

    /**
     * @notice Attestation 사용 처리
     * @dev MinecraftPFP 컨트랙트에서 민팅 시 호출하여 attestation을 사용 완료 처리
     * @param user 사용자 주소
     */
    function markAttestationUsed(address user) external {
        require(msg.sender == minecraftPFP, "Only MinecraftPFP can mark used");

        bytes32 attestationId = userToLatestAttestation[user];
        require(attestationId != bytes32(0), "No attestation found");

        ReceivedAttestation storage attestation = receivedAttestations[attestationId];
        require(attestation.owner == user, "Owner mismatch");
        require(!attestation.used, "Already used");
        require(
            block.timestamp <= attestation.receivedAt + MAX_ATTESTATION_AGE,
            "Attestation expired"
        );

        // 사용 처리
        attestation.used = true;

        emit AttestationUsed(attestationId, user);
    }

    /**
     * @notice 특정 attestation 조회
     * @param attestationId 조회할 attestation ID
     * @return ReceivedAttestation 데이터
     */
    function getAttestation(bytes32 attestationId)
        external
        view
        returns (ReceivedAttestation memory)
    {
        return receivedAttestations[attestationId];
    }

    /**
     * @notice 사용자의 최신 attestation 조회
     * @param user 조회할 사용자 주소
     * @return ReceivedAttestation 데이터
     */
    function getUserLatestAttestation(address user)
        external
        view
        returns (ReceivedAttestation memory)
    {
        bytes32 attestationId = userToLatestAttestation[user];
        require(attestationId != bytes32(0), "No attestation found");
        return receivedAttestations[attestationId];
    }

    /**
     * @notice Attestation 유효성 상세 확인
     * @param user 확인할 사용자 주소
     * @return hasAttestation attestation 존재 여부
     * @return isUsed 사용 여부
     * @return isExpired 만료 여부
     * @return remainingTime 남은 유효 시간 (초)
     */
    function getAttestationStatus(address user)
        external
        view
        returns (
            bool hasAttestation,
            bool isUsed,
            bool isExpired,
            uint256 remainingTime
        )
    {
        bytes32 attestationId = userToLatestAttestation[user];

        if (attestationId == bytes32(0)) {
            return (false, false, false, 0);
        }

        ReceivedAttestation memory attestation = receivedAttestations[attestationId];

        hasAttestation = (attestation.owner == user);
        isUsed = attestation.used;

        uint256 expiryTime = attestation.receivedAt + MAX_ATTESTATION_AGE;
        isExpired = (block.timestamp > expiryTime);

        if (isExpired) {
            remainingTime = 0;
        } else {
            remainingTime = expiryTime - block.timestamp;
        }

        return (hasAttestation, isUsed, isExpired, remainingTime);
    }

    /**
     * @notice Verifier 신뢰 여부 확인
     * @param sourceChainSelector 소스 체인 selector
     * @param verifier 확인할 Verifier 주소
     * @return 신뢰 여부
     */
    function isTrustedVerifier(
        uint64 sourceChainSelector,
        address verifier
    ) external view returns (bool) {
        return trustedVerifiers[sourceChainSelector][verifier];
    }

    /**
     * @notice CCIP Router만 호출 가능하도록 제한
     */
    modifier onlyRouter() {
        if (msg.sender != ccipRouter) revert InvalidRouter(msg.sender);
        _;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./TraitGenerator.sol";

/**
 * @title MinecraftPFPWithWealth
 * @dev Deterministic trait generation + Wealth-based special items
 *
 * 주요 기능:
 * 1. 주소 기반 결정론적 속성 생성 (TraitGenerator)
 * 2. Chainlink Price Feed를 통한 실시간 자산 가치 계산
 * 3. 민팅 시점의 자산 스냅샷 저장
 * 4. Wealth tier에 따른 special item 부여
 * 5. OpenSea 호환 메타데이터 (IPFS)
 */
contract MinecraftPFPWithWealth is ERC721URIStorage, Ownable {
    using TraitGenerator for address;

    // ========== Immutable Variables ==========

    /// @notice Chainlink Price Feed - SOL/USD
    AggregatorV3Interface public immutable solUsdPriceFeed;

    /// @notice SOL token address
    address public immutable SOL;

    // ========== Constants ==========

    /// @notice Wealth tier thresholds (USD, 8 decimals)
    uint256 public constant TIER_BRONZE = 1000 * 1e8;      // $1,000
    uint256 public constant TIER_SILVER = 10000 * 1e8;     // $10,000
    uint256 public constant TIER_GOLD = 50000 * 1e8;       // $50,000
    uint256 public constant TIER_PLATINUM = 100000 * 1e8;  // $100,000
    uint256 public constant TIER_DIAMOND = 500000 * 1e8;   // $500,000

    /// @notice Price feed staleness threshold
    uint256 public constant PRICE_STALENESS_THRESHOLD = 1 hours;

    // ========== State Variables ==========

    /// @notice Token ID counter
    uint256 private _tokenIdCounter;

    /// @notice Mapping from owner address to token ID
    mapping(address => uint256) public ownerToToken;

    /// @notice CCIP Receiver contract address
    address public ccipReceiver;

    /// @notice Mapping from token ID to CCIP bonus status
    mapping(uint256 => bool) public hasCCIPBonus;

    /**
     * @dev Mint snapshot structure
     * 민팅 시점의 자산 정보를 온체인에 영구 저장
     */
    struct MintSnapshot {
        uint256 totalWealthUSD;  // 총 자산 (USD, 8 decimals)
        uint8 wealthTier;         // 자산 등급 (0-5)
        uint256 solBalance;       // SOL 잔액 (decimals: 18)
        uint256 timestamp;        // 민팅 시각
    }

    /// @notice Mapping from token ID to mint snapshot
    mapping(uint256 => MintSnapshot) public mintSnapshots;

    // ========== Events ==========

    event NFTMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 totalWealthUSD,
        uint8 wealthTier,
        uint8 specialItem
    );

    event WealthCalculated(
        address indexed owner,
        uint256 solValue,
        uint256 totalValue,
        uint8 tier
    );

    event CCIPBonusGranted(
        uint256 indexed tokenId,
        address indexed owner
    );

    // ========== Constructor ==========

    /**
     * @dev 컨트랙트 초기화
     * @param _solUsdPriceFeed SOL/USD Chainlink Price Feed 주소
     * @param _sol SOL 토큰 주소
     */
    constructor(
        address _solUsdPriceFeed,
        address _sol
    ) ERC721("MinecraftPFP", "MCPFP") Ownable(msg.sender) {
        require(_solUsdPriceFeed != address(0), "Invalid SOL price feed");
        require(_sol != address(0), "Invalid SOL address");

        solUsdPriceFeed = AggregatorV3Interface(_solUsdPriceFeed);
        SOL = _sol;
    }

    // ========== Price Feed Functions ==========

    /**
     * @dev SOL/USD 가격 조회
     * @return SOL 가격 (8 decimals)
     */
    function getSOLPriceUSD() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = solUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid SOL price");
        require(block.timestamp - updatedAt < PRICE_STALENESS_THRESHOLD, "Stale SOL price");
        return uint256(price);
    }

    // ========== Wealth Calculation ==========

    /**
     * @dev 주소의 총 자산 가치 계산 (SOL)
     * @param owner 조회할 주소
     * @return solValueUSD SOL의 USD 가치 (8 decimals)
     * @return totalValueUSD 총 자산의 USD 가치 (8 decimals)
     */
    function calculateTotalWealth(address owner) public view returns (
        uint256 solValueUSD,
        uint256 totalValueUSD
    ) {
        // SOL 가치 계산
        uint256 solBalance = IERC20(SOL).balanceOf(owner);
        uint256 solPrice = getSOLPriceUSD();
        solValueUSD = (solBalance * solPrice) / 1e18;

        // 총 자산 계산
        totalValueUSD = solValueUSD;

        return (solValueUSD, totalValueUSD);
    }

    /**
     * @dev 자산 가치로부터 wealth tier 결정
     * @param totalValueUSD 총 자산 (USD, 8 decimals)
     * @return tier 자산 등급 (0-5)
     */
    function getWealthTier(uint256 totalValueUSD) public pure returns (uint8) {
        if (totalValueUSD >= TIER_DIAMOND) return 5;
        if (totalValueUSD >= TIER_PLATINUM) return 4;
        if (totalValueUSD >= TIER_GOLD) return 3;
        if (totalValueUSD >= TIER_SILVER) return 2;
        if (totalValueUSD >= TIER_BRONZE) return 1;
        return 0;
    }

    /**
     * @dev Wealth tier와 주소로부터 special item ID 생성
     * @param tier 자산 등급 (0-5)
     * @param owner 소유자 주소
     * @return specialItem 특별 아이템 ID (0-19)
     *
     * Tier별 아이템 범위:
     * - Tier 0 (None): 0
     * - Tier 1 (Bronze): 1-3
     * - Tier 2 (Silver): 4-6
     * - Tier 3 (Gold): 7-10
     * - Tier 4 (Platinum): 11-14
     * - Tier 5 (Diamond): 15-19
     */
    function getSpecialItemFromWealth(uint8 tier, address owner) public pure returns (uint8) {
        if (tier == 0) return 0;

        uint256 seed = uint256(keccak256(abi.encodePacked(owner, tier)));

        if (tier == 1) return uint8(seed % 3) + 1;   // 1-3
        if (tier == 2) return uint8(seed % 3) + 4;   // 4-6
        if (tier == 3) return uint8(seed % 4) + 7;   // 7-10
        if (tier == 4) return uint8(seed % 4) + 11;  // 11-14
        return uint8(seed % 5) + 15;                  // 15-19
    }

    // ========== Minting ==========

    /**
     * @dev NFT 민팅 (주소당 1개만 가능)
     * @param ipfsUri IPFS 메타데이터 URI
     * @return tokenId 발행된 토큰 ID
     */
    function mint(string memory ipfsUri) public returns (uint256) {
        require(ownerToToken[msg.sender] == 0, "Already minted");
        require(bytes(ipfsUri).length > 0, "Empty URI");

        // 자산 가치 계산
        (
            uint256 solValueUSD,
            uint256 totalValueUSD
        ) = calculateTotalWealth(msg.sender);

        // Tier 및 Special Item 결정
        uint8 tier = getWealthTier(totalValueUSD);
        uint8 specialItem = getSpecialItemFromWealth(tier, msg.sender);

        // 토큰 발행
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsUri);

        // CCIP Attestation 체크
        if (ccipReceiver != address(0)) {
            // MonadCCIPReceiver 인터페이스를 통해 attestation 확인
            (bool success, bytes memory data) = ccipReceiver.staticcall(
                abi.encodeWithSignature("hasValidAttestation(address)", msg.sender)
            );

            if (success && data.length > 0) {
                bool hasAttestation = abi.decode(data, (bool));

                if (hasAttestation) {
                    hasCCIPBonus[tokenId] = true;

                    // Attestation 사용 처리
                    (bool markSuccess, ) = ccipReceiver.call(
                        abi.encodeWithSignature("markAttestationUsed(address)", msg.sender)
                    );

                    if (markSuccess) {
                        emit CCIPBonusGranted(tokenId, msg.sender);
                    }
                }
            }
        }

        // 스냅샷 저장
        mintSnapshots[tokenId] = MintSnapshot({
            totalWealthUSD: totalValueUSD,
            wealthTier: tier,
            solBalance: IERC20(SOL).balanceOf(msg.sender),
            timestamp: block.timestamp
        });

        ownerToToken[msg.sender] = tokenId;

        emit NFTMinted(msg.sender, tokenId, totalValueUSD, tier, specialItem);
        emit WealthCalculated(msg.sender, solValueUSD, totalValueUSD, tier);

        return tokenId;
    }

    // ========== CCIP Functions ==========

    /**
     * @notice CCIP Receiver 주소 설정
     * @dev Only owner can set the CCIP receiver contract
     * @param _ccipReceiver MonadCCIPReceiver 컨트랙트 주소
     */
    function setCCIPReceiver(address _ccipReceiver) external onlyOwner {
        require(_ccipReceiver != address(0), "Invalid CCIP receiver address");
        ccipReceiver = _ccipReceiver;
    }

    /**
     * @notice 토큰의 CCIP 보너스 상태 조회
     * @param tokenId 조회할 토큰 ID
     * @return CCIP 보너스 여부
     */
    function getTokenCCIPStatus(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return hasCCIPBonus[tokenId];
    }

    // ========== Query Functions ==========

    /**
     * @dev 토큰 정보 조회
     * @param tokenId 조회할 토큰 ID
     */
    function getTokenInfo(uint256 tokenId) public view returns (
        address owner,
        TraitGenerator.SkinTraits memory traits,
        uint256 totalWealthUSD,
        uint8 wealthTier,
        uint8 specialItem,
        uint256 mintTimestamp
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        owner = ownerOf(tokenId);
        traits = owner.generateTraits();

        MintSnapshot memory snapshot = mintSnapshots[tokenId];
        totalWealthUSD = snapshot.totalWealthUSD;
        wealthTier = snapshot.wealthTier;
        specialItem = getSpecialItemFromWealth(wealthTier, owner);
        mintTimestamp = snapshot.timestamp;

        return (owner, traits, totalWealthUSD, wealthTier, specialItem, mintTimestamp);
    }

    /**
     * @dev 민팅 전 미리보기
     * @param owner 미리보기할 주소
     */
    function previewMint(address owner) public view returns (
        TraitGenerator.SkinTraits memory traits,
        uint256 totalWealthUSD,
        uint8 wealthTier,
        uint8 specialItem,
        uint256 solValueUSD
    ) {
        traits = owner.generateTraits();
        (solValueUSD, totalWealthUSD) = calculateTotalWealth(owner);
        wealthTier = getWealthTier(totalWealthUSD);
        specialItem = getSpecialItemFromWealth(wealthTier, owner);

        return (traits, totalWealthUSD, wealthTier, specialItem, solValueUSD);
    }

    /**
     * @dev URI 업데이트 (소유자만 가능)
     * @param tokenId 토큰 ID
     * @param newUri 새로운 URI
     */
    function updateTokenURI(uint256 tokenId, string memory newUri) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(bytes(newUri).length > 0, "Empty URI");
        _setTokenURI(tokenId, newUri);
    }

    /**
     * @dev 총 발행량 조회
     * @return 현재까지 발행된 토큰 수
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}

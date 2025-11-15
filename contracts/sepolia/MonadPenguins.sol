// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MonadPenguins
 * @notice 모나드에서 길을 잃은 펭귄들의 NFT 컬렉션
 * @dev ERC721 기반, 결정론적 trait 생성, 총 1,000개 한정
 *
 * 스토리: 모나드 체인의 극지방에 살던 펭귄들이 크로스체인 포털 오작동으로
 *        이더리움 세폴리아로 이동하게 되었습니다.
 *        이 펭귄들을 소유한 사람들은 Monad Testnet에서 특별한 보상을 받습니다!
 */
contract MonadPenguins is ERC721URIStorage, Ownable {
    using Strings for uint256;

    // ============================================
    // State Variables
    // ============================================

    uint256 private _nextTokenId;

    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MINT_PRICE = 0.001 ether;

    string public baseTokenURI;
    bool public mintingEnabled = true;

    // ============================================
    // Structs
    // ============================================

    struct PenguinTraits {
        uint8 bodyColor;      // 0-9: 펭귄 몸통 색상
        uint8 beakType;       // 0-4: 부리 모양
        uint8 eyeType;        // 0-6: 눈 모양
        uint8 accessory;      // 0-9: 액세서리
        uint8 background;     // 0-7: 배경
        uint8 rarity;         // 0-3: 희귀도 (Common, Rare, Epic, Legendary)
        uint256 rescueNumber; // 구출 순서 번호 (tokenId와 동일)
    }

    // ============================================
    // Mappings
    // ============================================

    mapping(uint256 => PenguinTraits) public penguinTraits;

    // ============================================
    // Events
    // ============================================

    event PenguinMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 rescueNumber,
        uint8 rarity
    );

    event MintingStatusChanged(bool enabled);
    event BaseURIUpdated(string newBaseURI);

    // ============================================
    // Constructor
    // ============================================

    constructor(string memory _baseTokenURI)
        ERC721("Monad Penguins", "MPEN")
        Ownable(msg.sender)
    {
        baseTokenURI = _baseTokenURI;
    }

    // ============================================
    // Minting Functions
    // ============================================

    /**
     * @notice 펭귄 NFT 민팅
     * @dev 최대 1,000개까지 민팅 가능, 결정론적 trait 생성
     * @return tokenId 민팅된 토큰 ID
     */
    function mint() public payable returns (uint256) {
        require(mintingEnabled, "Minting is disabled");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");

        uint256 tokenId = ++_nextTokenId;

        // 결정론적 trait 생성
        PenguinTraits memory traits = _generateTraits(tokenId, msg.sender);
        penguinTraits[tokenId] = traits;

        // NFT 민팅
        _safeMint(msg.sender, tokenId);

        // 메타데이터 URI 설정
        string memory tokenURI = string(
            abi.encodePacked(baseTokenURI, tokenId.toString(), ".json")
        );
        _setTokenURI(tokenId, tokenURI);

        emit PenguinMinted(msg.sender, tokenId, traits.rescueNumber, traits.rarity);

        return tokenId;
    }

    /**
     * @notice 오너 전용 무료 민팅 (에어드랍, 팀 할당 등)
     * @param to 받을 주소
     * @return tokenId 민팅된 토큰 ID
     */
    function mintTo(address to) public onlyOwner returns (uint256) {
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = ++_nextTokenId;

        PenguinTraits memory traits = _generateTraits(tokenId, to);
        penguinTraits[tokenId] = traits;

        _safeMint(to, tokenId);

        string memory tokenURI = string(
            abi.encodePacked(baseTokenURI, tokenId.toString(), ".json")
        );
        _setTokenURI(tokenId, tokenURI);

        emit PenguinMinted(to, tokenId, traits.rescueNumber, traits.rarity);

        return tokenId;
    }

    /**
     * @notice 배치 민팅 (오너 전용)
     * @param to 받을 주소
     * @param amount 민팅할 개수
     */
    function batchMint(address to, uint256 amount) public onlyOwner {
        require(_nextTokenId + amount <= MAX_SUPPLY, "Exceeds max supply");

        for (uint256 i = 0; i < amount; i++) {
            mintTo(to);
        }
    }

    // ============================================
    // Internal Functions
    // ============================================

    /**
     * @notice 결정론적 trait 생성
     * @dev 블록 타임스탬프, prevrandao, 민터 주소, 토큰 ID를 사용하여 무작위성 생성
     * @param tokenId 토큰 ID
     * @param minter 민터 주소
     * @return PenguinTraits 생성된 trait
     */
    function _generateTraits(uint256 tokenId, address minter)
        private
        view
        returns (PenguinTraits memory)
    {
        uint256 randomSeed = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    minter,
                    tokenId
                )
            )
        );

        return PenguinTraits({
            bodyColor: uint8(randomSeed % 10),
            beakType: uint8((randomSeed / 10) % 5),
            eyeType: uint8((randomSeed / 50) % 7),
            accessory: uint8((randomSeed / 350) % 10),
            background: uint8((randomSeed / 3500) % 8),
            rarity: _calculateRarity(randomSeed),
            rescueNumber: tokenId
        });
    }

    /**
     * @notice 희귀도 계산 (확률 기반)
     * @dev Legendary: 1%, Epic: 9%, Rare: 30%, Common: 60%
     * @param seed 무작위 시드
     * @return 희귀도 (0-3)
     */
    function _calculateRarity(uint256 seed) private pure returns (uint8) {
        uint256 roll = seed % 100;

        if (roll < 1) return 3;  // Legendary (1%)
        if (roll < 10) return 2; // Epic (9%)
        if (roll < 40) return 1; // Rare (30%)
        return 0;                // Common (60%)
    }

    // ============================================
    // View Functions
    // ============================================

    /**
     * @notice 토큰의 trait 조회
     * @param tokenId 토큰 ID
     * @return PenguinTraits trait 정보
     */
    function getTraits(uint256 tokenId) external view returns (PenguinTraits memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return penguinTraits[tokenId];
    }

    /**
     * @notice 총 민팅된 NFT 개수
     * @return 총 공급량
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @notice 남은 민팅 가능 개수
     * @return 남은 개수
     */
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - _nextTokenId;
    }

    /**
     * @notice 사용자가 소유한 모든 토큰 ID 조회
     * @param owner 소유자 주소
     * @return tokenIds 소유한 토큰 ID 배열
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= _nextTokenId; i++) {
            if (_ownerOf(i) == owner) {
                tokenIds[index] = i;
                index++;
            }
        }

        return tokenIds;
    }

    /**
     * @notice 특정 희귀도의 총 개수 조회
     * @param rarity 희귀도 (0-3)
     * @return count 해당 희귀도 개수
     */
    function getRarityCount(uint8 rarity) external view returns (uint256 count) {
        require(rarity <= 3, "Invalid rarity");

        for (uint256 i = 1; i <= _nextTokenId; i++) {
            if (penguinTraits[i].rarity == rarity) {
                count++;
            }
        }
    }

    // ============================================
    // Admin Functions
    // ============================================

    /**
     * @notice 기본 URI 업데이트
     * @param _baseTokenURI 새로운 기본 URI
     */
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
        emit BaseURIUpdated(_baseTokenURI);
    }

    /**
     * @notice 민팅 활성화/비활성화
     * @param enabled 활성화 여부
     */
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingStatusChanged(enabled);
    }

    /**
     * @notice 특정 토큰의 URI 수동 업데이트
     * @param tokenId 토큰 ID
     * @param uri 새로운 URI
     */
    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, uri);
    }

    /**
     * @notice 민팅 가격 업데이트 (긴급 상황용)
     * @dev 보안상 이유로 constant 대신 immutable 사용 고려
     */
    // 참고: MINT_PRICE는 constant로 설정되어 있어 변경 불가
    // 필요시 새 컨트랙트 배포 권장

    /**
     * @notice 컨트랙트 잔액 인출
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice 긴급 ETH 인출 (특정 주소로)
     * @param to 받을 주소
     * @param amount 인출할 금액
     */
    function emergencyWithdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Emergency withdrawal failed");
    }

    // ============================================
    // Override Functions
    // ============================================

    /**
     * @notice ERC721 _baseURI 오버라이드
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    /**
     * @notice supportsInterface 오버라이드
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

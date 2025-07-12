//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

/**
 * A smart contract for storing user profiles and minting profile NFTs using ERC1155
 * @author BuidlGuidl
 */
contract ProfileNFT1155 is ERC1155, Ownable, ERC1155Supply {
    using Strings for uint256;
    
    // State Variables
    uint256 public nextTokenId = 1;
    uint256 public mintFee = 0 ether; // 민팅 수수료
    
    // Token ID constants for different types
    uint256 public constant PROFILE_TOKEN_TYPE = 1; // 프로필 토큰 타입

    // User Profile Structure
    struct UserProfile {
        address walletAddress; // 지갑 주소
        string name; // 이름
        string role; // 역할
        string introduction; // 한줄소개
        string skills; // 주요스킬
        string contact; // 연락처
        string portfolioLink; // 포트폴리오 링크 (옵셔널)
        string[] fileUrls; // 파일들 URL 배열
        string metadataUri; // NFT 메타데이터 URI
        uint256 timestamp; // 생성 시간
        bool exists; // 프로필 존재 여부
    }

    // NFT Token Structure
    struct NFTToken {
        uint256 tokenId;
        address owner;
        string metadataUri;
        uint256 mintedAt;
        uint256 tokenType; // 토큰 타입 (확장 가능)
    }

    // Mappings
    mapping(address => UserProfile) public userProfiles; // 지갑 주소 -> 프로필
    mapping(uint256 => NFTToken) public nftTokens;
    mapping(address => uint256[]) public userTokens; // 사용자가 소유한 토큰 ID들
    mapping(uint256 => string) private _tokenURIs; // 개별 토큰 URI

    // Events
    event ProfileCreated(address indexed walletAddress, string name, string role, uint256 timestamp);
    event ProfileUpdated(address indexed walletAddress, string name, string role, uint256 timestamp);
    event NFTMinted(address indexed to, uint256 indexed tokenId, string metadataUri, uint256 timestamp);
    event BatchNFTMinted(address[] recipients, uint256[] tokenIds, string metadataUri, uint256 timestamp);
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);

    // Constructor
    constructor(address _owner) ERC1155("") Ownable(_owner) {
        // ERC1155의 기본 URI는 빈 문자열로 설정하고 개별 토큰 URI 사용
    }

    // Override required functions for multiple inheritance
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }

    // Modifiers
    modifier onlyExistingProfile(address _walletAddress) {
        require(userProfiles[_walletAddress].exists, "Profile does not exist");
        _;
    }

    /**
     * 사용자 프로필 생성 (지갑 주소와 연결)
     */
    function createProfile(
        string memory _name,
        string memory _role,
        string memory _introduction,
        string memory _skills,
        string memory _contact,
        string memory _portfolioLink,
        string[] memory _fileUrls
    ) public {
        require(!userProfiles[msg.sender].exists, "Profile already exists");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_role).length > 0, "Role cannot be empty");

        console.log("Creating profile for wallet: %s", msg.sender);

        userProfiles[msg.sender] = UserProfile({
            walletAddress: msg.sender,
            name: _name,
            role: _role,
            introduction: _introduction,
            skills: _skills,
            contact: _contact,
            portfolioLink: _portfolioLink,
            fileUrls: _fileUrls,
            metadataUri: "",
            timestamp: block.timestamp,
            exists: true
        });

        emit ProfileCreated(msg.sender, _name, _role, block.timestamp);
    }

    /**
     * 사용자 프로필 업데이트
     */
    function updateProfile(
        string memory _name,
        string memory _role,
        string memory _introduction,
        string memory _skills,
        string memory _contact,
        string memory _portfolioLink,
        string[] memory _fileUrls
    ) public onlyExistingProfile(msg.sender) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_role).length > 0, "Role cannot be empty");

        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.role = _role;
        profile.introduction = _introduction;
        profile.skills = _skills;
        profile.contact = _contact;
        profile.portfolioLink = _portfolioLink;
        profile.fileUrls = _fileUrls;

        emit ProfileUpdated(msg.sender, _name, _role, block.timestamp);
    }

    /**
     * 파일 URL 추가
     */
    function addFileUrl(string memory _fileUrl) public onlyExistingProfile(msg.sender) {
        require(bytes(_fileUrl).length > 0, "File URL cannot be empty");
        userProfiles[msg.sender].fileUrls.push(_fileUrl);
    }

    /**
     * 단일 NFT 민팅 (ERC1155 방식)
     */
    function mintProfileNFT(address _to, string memory _metadataUri) public payable {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(bytes(_metadataUri).length > 0, "Metadata URI cannot be empty");
        require(userProfiles[_to].exists, "Recipient profile does not exist");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        // ERC1155 민팅 (수량 1개)
        _mint(_to, tokenId, 1, "");

        // NFT 토큰 정보 저장
        nftTokens[tokenId] = NFTToken({
            tokenId: tokenId,
            owner: _to,
            metadataUri: _metadataUri,
            mintedAt: block.timestamp,
            tokenType: PROFILE_TOKEN_TYPE
        });

        // 개별 토큰 URI 설정
        _tokenURIs[tokenId] = _metadataUri;

        // 사용자 토큰 목록에 추가
        userTokens[_to].push(tokenId);

        // 프로필에 메타데이터 URI 저장 (최신 것으로 업데이트)
        userProfiles[_to].metadataUri = _metadataUri;

        console.log("Minting ERC1155 NFT tokenId: %s for user: %s", tokenId, _to);

        emit NFTMinted(_to, tokenId, _metadataUri, block.timestamp);
    }

    /**
     * 배치 NFT 민팅 (여러 유저에게 동시에) - ERC1155 방식
     */
    function batchMintProfileNFT(address[] memory _recipients, string memory _metadataUri) public payable {
        require(_recipients.length > 0, "Recipients array cannot be empty");
        require(msg.value >= mintFee * _recipients.length, "Insufficient mint fee for batch");
        require(bytes(_metadataUri).length > 0, "Metadata URI cannot be empty");

        uint256[] memory tokenIds = new uint256[](_recipients.length);
        uint256[] memory amounts = new uint256[](_recipients.length);

        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            require(recipient != address(0), "Invalid recipient address");
            require(userProfiles[recipient].exists, "Recipient profile does not exist");

            uint256 tokenId = nextTokenId;
            nextTokenId++;

            tokenIds[i] = tokenId;
            amounts[i] = 1; // 각 토큰 1개씩

            // NFT 토큰 정보 저장
            nftTokens[tokenId] = NFTToken({
                tokenId: tokenId,
                owner: recipient,
                metadataUri: _metadataUri,
                mintedAt: block.timestamp,
                tokenType: PROFILE_TOKEN_TYPE
            });

            // 개별 토큰 URI 설정
            _tokenURIs[tokenId] = _metadataUri;

            // 사용자 토큰 목록에 추가
            userTokens[recipient].push(tokenId);

            // 프로필에 메타데이터 URI 저장
            userProfiles[recipient].metadataUri = _metadataUri;

            console.log("Batch minting ERC1155 NFT tokenId: %s for user: %s", tokenId, recipient);
        }

        // ERC1155 배치 민팅
        _mintBatch(_recipients[0], tokenIds, amounts, ""); // 첫 번째 수신자에게 모든 토큰을 민팅한 후
        
        // 각 토큰을 해당 수신자에게 전송
        for (uint256 i = 1; i < _recipients.length; i++) {
            _safeTransferFrom(_recipients[0], _recipients[i], tokenIds[i], 1, "");
        }

        emit BatchNFTMinted(_recipients, tokenIds, _metadataUri, block.timestamp);
    }

    /**
     * 개별 토큰 URI 반환 (ERC1155 표준)
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(exists(tokenId), "ERC1155: URI query for nonexistent token");
        
        string memory tokenURI = _tokenURIs[tokenId];
        if (bytes(tokenURI).length > 0) {
            return tokenURI;
        }
        
        // 기본 URI가 설정되어 있다면 사용
        return super.uri(tokenId);
    }

    /**
     * 토큰 URI 설정 (owner만 가능)
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner {
        require(exists(tokenId), "ERC1155: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * 지갑 주소로 사용자 프로필 조회 (view 함수 - 가스비 없음)
     */
    function getProfileByWallet(
        address _walletAddress
    )
        public
        view
        returns (
            address walletAddress,
            string memory name,
            string memory role,
            string memory introduction,
            string memory skills,
            string memory contact,
            string memory portfolioLink,
            string[] memory fileUrls,
            string memory metadataUri,
            uint256 timestamp
        )
    {
        require(userProfiles[_walletAddress].exists, "Profile does not exist");

        UserProfile memory profile = userProfiles[_walletAddress];
        return (
            profile.walletAddress,
            profile.name,
            profile.role,
            profile.introduction,
            profile.skills,
            profile.contact,
            profile.portfolioLink,
            profile.fileUrls,
            profile.metadataUri,
            profile.timestamp
        );
    }

    /**
     * 사용자의 파일 URL들 조회 (view 함수)
     */
    function getUserFileUrls(address _walletAddress) public view returns (string[] memory) {
        require(userProfiles[_walletAddress].exists, "Profile does not exist");
        return userProfiles[_walletAddress].fileUrls;
    }

    /**
     * 사용자가 소유한 NFT 토큰들 조회 (view 함수)
     */
    function getUserTokens(address _walletAddress) public view returns (uint256[] memory) {
        return userTokens[_walletAddress];
    }

    /**
     * 사용자가 소유한 특정 토큰의 수량 조회
     */
    function getUserTokenBalance(address _walletAddress, uint256 _tokenId) public view returns (uint256) {
        return balanceOf(_walletAddress, _tokenId);
    }

    /**
     * 사용자가 소유한 여러 토큰의 수량들 조회
     */
    function getUserTokenBalances(address _walletAddress, uint256[] memory _tokenIds) public view returns (uint256[] memory) {
        address[] memory addresses = new address[](_tokenIds.length);
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            addresses[i] = _walletAddress;
        }
        return balanceOfBatch(addresses, _tokenIds);
    }

    /**
     * NFT 토큰 정보 조회 (view 함수)
     */
    function getTokenInfo(
        uint256 _tokenId
    ) public view returns (uint256 tokenId, address tokenOwner, string memory metadataUri, uint256 mintedAt, uint256 tokenType) {
        require(exists(_tokenId), "Token does not exist");

        NFTToken memory token = nftTokens[_tokenId];
        return (token.tokenId, token.owner, token.metadataUri, token.mintedAt, token.tokenType);
    }

    /**
     * 프로필 존재 여부 확인 (view 함수)
     */
    function profileExists(address _walletAddress) public view returns (bool) {
        return userProfiles[_walletAddress].exists;
    }

    /**
     * 민팅 수수료 설정 (owner만 가능)
     */
    function setMintFee(uint256 _newFee) public onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = _newFee;
        emit MintFeeUpdated(oldFee, _newFee);
    }

    /**
     * 기본 URI 설정 (owner만 가능)
     */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /**
     * 컨트랙트 잔액 인출 (owner만 가능)
     */
    function withdraw() public onlyOwner {
        (bool success, ) = owner().call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * 컨트랙트가 ETH를 받을 수 있도록 함
     */
    receive() external payable {}

    /**
     * 현재 총 민팅된 유니크 토큰 수 (view 함수)
     */
    function totalMintedTokens() public view returns (uint256) {
        return nextTokenId - 1;
    }

    /**
     * 특정 토큰 ID의 총 공급량 조회
     */
    function totalSupply(uint256 id) public view override returns (uint256) {
        return super.totalSupply(id);
    }

    /**
     * 배치 민팅 수수료 계산 (view 함수)
     */
    function calculateBatchMintFee(uint256 _recipientCount) public view returns (uint256) {
        return mintFee * _recipientCount;
    }

    /**
     * 토큰 존재 여부 확인
     */
    function exists(uint256 id) public view override returns (bool) {
        return super.exists(id);
    }

    /**
     * ERC1155 지원 인터페이스 확인
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
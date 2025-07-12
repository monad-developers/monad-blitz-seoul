//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

/**
 * A smart contract for storing user profiles and minting profile NFTs
 * @author BuidlGuidl
 */
contract ProfileNFT {
    // State Variables
    address public immutable owner;
    uint256 public nextTokenId = 1;
    uint256 public mintFee = 0 ether; // 민팅 수수료

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
    }

    // Mappings
    mapping(address => UserProfile) public userProfiles; // 지갑 주소 -> 프로필
    mapping(uint256 => NFTToken) public nftTokens;
    mapping(address => uint256[]) public userTokens; // 사용자가 소유한 토큰 ID들
    mapping(uint256 => address) public tokenOwners;

    // Events
    event ProfileCreated(address indexed walletAddress, string name, string role, uint256 timestamp);

    event ProfileUpdated(address indexed walletAddress, string name, string role, uint256 timestamp);

    event NFTMinted(address indexed to, uint256 indexed tokenId, string metadataUri, uint256 timestamp);

    event BatchNFTMinted(address[] recipients, uint256[] tokenIds, string metadataUri, uint256 timestamp);

    event MintFeeUpdated(uint256 oldFee, uint256 newFee);

    // Constructor
    constructor(address _owner) {
        owner = _owner;
    }

    // Modifiers
    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

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
     * 단일 NFT 민팅
     */
    function mintProfileNFT(address _to, string memory _metadataUri) public payable {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(bytes(_metadataUri).length > 0, "Metadata URI cannot be empty");
        require(userProfiles[_to].exists, "Recipient profile does not exist");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        // NFT 토큰 생성
        nftTokens[tokenId] = NFTToken({
            tokenId: tokenId,
            owner: _to,
            metadataUri: _metadataUri,
            mintedAt: block.timestamp
        });

        // 소유권 매핑 업데이트
        tokenOwners[tokenId] = _to;
        userTokens[_to].push(tokenId);

        // 프로필에 메타데이터 URI 저장 (최신 것으로 업데이트)
        userProfiles[_to].metadataUri = _metadataUri;

        console.log("Minting NFT tokenId: %s for user: %s", tokenId, _to);

        emit NFTMinted(_to, tokenId, _metadataUri, block.timestamp);
    }

    /**
     * 배치 NFT 민팅 (여러 유저에게 동시에)
     */
    function batchMintProfileNFT(address[] memory _recipients, string memory _metadataUri) public payable {
        require(_recipients.length > 0, "Recipients array cannot be empty");
        require(msg.value >= mintFee * _recipients.length, "Insufficient mint fee for batch");
        require(bytes(_metadataUri).length > 0, "Metadata URI cannot be empty");

        uint256[] memory tokenIds = new uint256[](_recipients.length);

        for (uint256 i = 0; i < _recipients.length; i++) {
            address recipient = _recipients[i];
            require(recipient != address(0), "Invalid recipient address");
            require(userProfiles[recipient].exists, "Recipient profile does not exist");

            uint256 tokenId = nextTokenId;
            nextTokenId++;

            // NFT 토큰 생성
            nftTokens[tokenId] = NFTToken({
                tokenId: tokenId,
                owner: recipient,
                metadataUri: _metadataUri,
                mintedAt: block.timestamp
            });

            // 소유권 매핑 업데이트
            tokenOwners[tokenId] = recipient;
            userTokens[recipient].push(tokenId);

            // 프로필에 메타데이터 URI 저장
            userProfiles[recipient].metadataUri = _metadataUri;

            tokenIds[i] = tokenId;

            console.log("Batch minting NFT tokenId: %s for user: %s", tokenId, recipient);
        }

        emit BatchNFTMinted(_recipients, tokenIds, _metadataUri, block.timestamp);
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
     * NFT 토큰 정보 조회 (view 함수)
     */
    function getTokenInfo(
        uint256 _tokenId
    ) public view returns (uint256 tokenId, address tokenOwner, string memory metadataUri, uint256 mintedAt) {
        require(tokenOwners[_tokenId] != address(0), "Token does not exist");

        NFTToken memory token = nftTokens[_tokenId];
        return (token.tokenId, token.owner, token.metadataUri, token.mintedAt);
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
    function setMintFee(uint256 _newFee) public isOwner {
        uint256 oldFee = mintFee;
        mintFee = _newFee;
        emit MintFeeUpdated(oldFee, _newFee);
    }

    /**
     * 컨트랙트 잔액 인출 (owner만 가능)
     */
    function withdraw() public isOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * 컨트랙트가 ETH를 받을 수 있도록 함
     */
    receive() external payable {}

    /**
     * 현재 총 민팅된 NFT 수 (view 함수)
     */
    function totalSupply() public view returns (uint256) {
        return nextTokenId - 1;
    }

    /**
     * 배치 민팅 수수료 계산 (view 함수)
     */
    function calculateBatchMintFee(uint256 _recipientCount) public view returns (uint256) {
        return mintFee * _recipientCount;
    }
}

# 스마트 컨트랙트

## 📜 전체 코드

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title TraitGenerator
 * @dev Address 기반 deterministic trait 생성 라이브러리
 */
library TraitGenerator {
    struct SkinTraits {
        uint8 hatStyle;
        uint8 hatColor;
        uint8 hatOpacity;
        uint8 clothesStyle;
        uint8 clothesColor;
        uint8 clothesOpacity;
        uint8 shoesStyle;
        uint8 shoesColor;
        uint8 shoesOpacity;
        uint8 pantsStyle;
        uint8 pantsColor;
        uint8 pantsOpacity;
        uint8 skinTone;
        uint8 skinShade;
    }

    function generateTraits(address owner) internal pure returns (SkinTraits memory) {
        bytes20 addrBytes = bytes20(owner);
        SkinTraits memory traits;

        // Segment 1: 모자
        uint32 seg1 = uint32(bytes4(addrBytes));
        traits.hatStyle = uint8(seg1 % 10);
        traits.hatColor = getColorFamily(seg1);
        traits.hatOpacity = uint8((seg1 >> 8) % 156) + 100;

        // Segment 2: 옷
        uint32 seg2 = uint32(bytes4(addrBytes << 32));
        traits.clothesStyle = uint8(seg2 % 15);
        traits.clothesColor = getColorFamily(seg2);
        traits.clothesOpacity = uint8((seg2 >> 8) % 156) + 100;

        // Segment 3: 신발
        uint32 seg3 = uint32(bytes4(addrBytes << 64));
        traits.shoesStyle = uint8(seg3 % 8);
        traits.shoesColor = getColorFamily(seg3);
        traits.shoesOpacity = uint8((seg3 >> 8) % 156) + 100;

        // Segment 4: 바지
        uint32 seg4 = uint32(bytes4(addrBytes << 96));
        traits.pantsStyle = uint8(seg4 % 12);
        traits.pantsColor = getColorFamily(seg4);
        traits.pantsOpacity = uint8((seg4 >> 8) % 156) + 100;

        // Segment 5: 피부
        uint32 seg5 = uint32(bytes4(addrBytes << 128));
        traits.skinTone = uint8(seg5 % 6);
        traits.skinShade = uint8((seg5 >> 8) % 50);

        return traits;
    }

    function getColorFamily(uint32 segment) internal pure returns (uint8) {
        if (segment % 3 == 0) return 0;  // Blue
        if (segment % 5 == 0) return 1;  // Yellow
        if (segment % 7 == 0) return 2;  // Red
        if (segment % 11 == 0) return 3; // Green
        if (segment % 13 == 0) return 4; // Purple
        return 5;                         // Neutral
    }
}

/**
 * @title MinecraftPFPWithWealth
 * @dev 메인 NFT 컨트랙트
 */
contract MinecraftPFPWithWealth is ERC721URIStorage, Ownable {
    using TraitGenerator for address;

    // Chainlink Price Feeds
    AggregatorV3Interface public immutable ethUsdPriceFeed;
    AggregatorV3Interface public immutable usdtUsdPriceFeed;
    AggregatorV3Interface public immutable usdcUsdPriceFeed;

    // Token addresses
    address public immutable USDT;
    address public immutable USDC;

    // Wealth tier thresholds (USD, 8 decimals)
    uint256 public constant TIER_BRONZE = 1000 * 1e8;
    uint256 public constant TIER_SILVER = 10000 * 1e8;
    uint256 public constant TIER_GOLD = 50000 * 1e8;
    uint256 public constant TIER_PLATINUM = 100000 * 1e8;
    uint256 public constant TIER_DIAMOND = 500000 * 1e8;

    // State variables
    uint256 private _tokenIdCounter;
    mapping(address => uint256) public ownerToToken;

    struct MintSnapshot {
        uint256 totalWealthUSD;
        uint8 wealthTier;
        uint256 ethBalance;
        uint256 usdtBalance;
        uint256 usdcBalance;
        uint256 timestamp;
    }

    mapping(uint256 => MintSnapshot) public mintSnapshots;

    // Events
    event NFTMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 totalWealthUSD,
        uint8 wealthTier,
        uint8 specialItem
    );

    event WealthCalculated(
        address indexed owner,
        uint256 ethValue,
        uint256 usdtValue,
        uint256 usdcValue,
        uint256 totalValue,
        uint8 tier
    );

    constructor(
        address _ethUsdPriceFeed,
        address _usdtUsdPriceFeed,
        address _usdcUsdPriceFeed,
        address _usdt,
        address _usdc
    ) ERC721("MinecraftPFP", "MCPFP") Ownable(msg.sender) {
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        usdtUsdPriceFeed = AggregatorV3Interface(_usdtUsdPriceFeed);
        usdcUsdPriceFeed = AggregatorV3Interface(_usdcUsdPriceFeed);
        USDT = _usdt;
        USDC = _usdc;
    }

    /**
     * @dev Price feed 조회 함수들
     */
    function getETHPriceUSD() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = ethUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid ETH price");
        require(block.timestamp - updatedAt < 1 hours, "Stale ETH price");
        return uint256(price);
    }

    function getUSDTPriceUSD() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = usdtUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid USDT price");
        require(block.timestamp - updatedAt < 1 hours, "Stale USDT price");
        return uint256(price);
    }

    function getUSDCPriceUSD() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = usdcUsdPriceFeed.latestRoundData();
        require(price > 0, "Invalid USDC price");
        require(block.timestamp - updatedAt < 1 hours, "Stale USDC price");
        return uint256(price);
    }

    /**
     * @dev 총 자산 가치 계산
     */
    function calculateTotalWealth(address owner) public view returns (
        uint256 ethValueUSD,
        uint256 usdtValueUSD,
        uint256 usdcValueUSD,
        uint256 totalValueUSD
    ) {
        // ETH
        uint256 ethBalance = owner.balance;
        uint256 ethPrice = getETHPriceUSD();
        ethValueUSD = (ethBalance * ethPrice) / 1e18;

        // USDT
        uint256 usdtBalance = IERC20(USDT).balanceOf(owner);
        uint256 usdtPrice = getUSDTPriceUSD();
        usdtValueUSD = (usdtBalance * usdtPrice) / 1e6;

        // USDC
        uint256 usdcBalance = IERC20(USDC).balanceOf(owner);
        uint256 usdcPrice = getUSDCPriceUSD();
        usdcValueUSD = (usdcBalance * usdcPrice) / 1e6;

        totalValueUSD = ethValueUSD + usdtValueUSD + usdcValueUSD;

        return (ethValueUSD, usdtValueUSD, usdcValueUSD, totalValueUSD);
    }

    /**
     * @dev Wealth tier 결정
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
     * @dev Special item ID 생성
     */
    function getSpecialItemFromWealth(uint8 tier, address owner) public pure returns (uint8) {
        if (tier == 0) return 0;

        uint256 seed = uint256(keccak256(abi.encodePacked(owner, tier)));

        if (tier == 1) return uint8(seed % 3) + 1;
        if (tier == 2) return uint8(seed % 3) + 4;
        if (tier == 3) return uint8(seed % 4) + 7;
        if (tier == 4) return uint8(seed % 4) + 11;
        return uint8(seed % 5) + 15;
    }

    /**
     * @dev NFT 민팅
     */
    function mint(string memory ipfsUri) public returns (uint256) {
        require(ownerToToken[msg.sender] == 0, "Already minted");

        // 자산 가치 계산
        (
            uint256 ethValueUSD,
            uint256 usdtValueUSD,
            uint256 usdcValueUSD,
            uint256 totalValueUSD
        ) = calculateTotalWealth(msg.sender);

        // Tier 결정
        uint8 tier = getWealthTier(totalValueUSD);
        uint8 specialItem = getSpecialItemFromWealth(tier, msg.sender);

        // 토큰 발행
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, ipfsUri);

        // 스냅샷 저장
        mintSnapshots[tokenId] = MintSnapshot({
            totalWealthUSD: totalValueUSD,
            wealthTier: tier,
            ethBalance: msg.sender.balance,
            usdtBalance: IERC20(USDT).balanceOf(msg.sender),
            usdcBalance: IERC20(USDC).balanceOf(msg.sender),
            timestamp: block.timestamp
        });

        ownerToToken[msg.sender] = tokenId;

        emit NFTMinted(msg.sender, tokenId, totalValueUSD, tier, specialItem);
        emit WealthCalculated(msg.sender, ethValueUSD, usdtValueUSD, usdcValueUSD, totalValueUSD, tier);

        return tokenId;
    }

    /**
     * @dev 토큰 정보 조회
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
     * @dev 미리보기 (민팅 전)
     */
    function previewMint(address owner) public view returns (
        TraitGenerator.SkinTraits memory traits,
        uint256 totalWealthUSD,
        uint8 wealthTier,
        uint8 specialItem,
        uint256 ethValueUSD,
        uint256 usdtValueUSD,
        uint256 usdcValueUSD
    ) {
        traits = owner.generateTraits();
        (ethValueUSD, usdtValueUSD, usdcValueUSD, totalWealthUSD) = calculateTotalWealth(owner);
        wealthTier = getWealthTier(totalValueUSD);
        specialItem = getSpecialItemFromWealth(wealthTier, owner);

        return (traits, totalWealthUSD, wealthTier, specialItem, ethValueUSD, usdtValueUSD, usdcValueUSD);
    }

    /**
     * @dev URI 업데이트 (리렌더링 시)
     */
    function updateTokenURI(uint256 tokenId, string memory newUri) public {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _setTokenURI(tokenId, newUri);
    }

    /**
     * @dev 총 발행량
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
```

---

## 🧪 테스트 코드

```typescript
// test/MinecraftPFP.test.ts
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('MinecraftPFPWithWealth', function () {
    let contract;
    let owner;
    let user1;
    let user2;

    // Price Feed addresses (Sepolia)
    const ETH_USD_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
    const USDT_USD_FEED = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';
    const USDC_USD_FEED = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';

    // Token addresses (Sepolia)
    const USDT = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
    const USDC = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const MinecraftPFP = await ethers.getContractFactory('MinecraftPFPWithWealth');
        contract = await MinecraftPFP.deploy(
            ETH_USD_FEED,
            USDT_USD_FEED,
            USDC_USD_FEED,
            USDT,
            USDC
        );
    });

    describe('Deployment', function () {
        it('Should set the right owner', async function () {
            expect(await contract.owner()).to.equal(owner.address);
        });

        it('Should set price feeds correctly', async function () {
            expect(await contract.ethUsdPriceFeed()).to.equal(ETH_USD_FEED);
            expect(await contract.usdtUsdPriceFeed()).to.equal(USDT_USD_FEED);
            expect(await contract.usdcUsdPriceFeed()).to.equal(USDC_USD_FEED);
        });
    });

    describe('Trait Generation', function () {
        it('Should generate deterministic traits', async function () {
            const preview1 = await contract.previewMint(user1.address);
            const preview2 = await contract.previewMint(user1.address);

            expect(preview1.traits.hatStyle).to.equal(preview2.traits.hatStyle);
            expect(preview1.traits.clothesStyle).to.equal(preview2.traits.clothesStyle);
        });

        it('Should generate different traits for different addresses', async function () {
            const preview1 = await contract.previewMint(user1.address);
            const preview2 = await contract.previewMint(user2.address);

            // 다른 주소는 다른 속성을 가져야 함
            const sameTraits =
                preview1.traits.hatStyle === preview2.traits.hatStyle &&
                preview1.traits.clothesStyle === preview2.traits.clothesStyle &&
                preview1.traits.shoesStyle === preview2.traits.shoesStyle;

            expect(sameTraits).to.be.false;
        });
    });

    describe('Wealth Calculation', function () {
        it('Should calculate ETH value correctly', async function () {
            const preview = await contract.previewMint(user1.address);
            expect(preview.ethValueUSD).to.be.gt(0);
        });

        it('Should determine wealth tier correctly', async function () {
            const totalWealth = ethers.parseUnits('75000', 8); // $75,000
            const tier = await contract.getWealthTier(totalWealth);
            expect(tier).to.equal(3); // Gold tier
        });
    });

    describe('Minting', function () {
        it('Should mint NFT successfully', async function () {
            const ipfsUri = 'ipfs://QmTest123';
            const tx = await contract.connect(user1).mint(ipfsUri);
            await tx.wait();

            expect(await contract.ownerOf(1)).to.equal(user1.address);
            expect(await contract.tokenURI(1)).to.equal(ipfsUri);
        });

        it('Should prevent double minting', async function () {
            await contract.connect(user1).mint('ipfs://QmTest1');

            await expect(contract.connect(user1).mint('ipfs://QmTest2')).to.be.revertedWith(
                'Already minted'
            );
        });

        it('Should emit NFTMinted event', async function () {
            await expect(contract.connect(user1).mint('ipfs://QmTest'))
                .to.emit(contract, 'NFTMinted')
                .withArgs(
                    user1.address,
                    1,
                    // totalWealthUSD, tier, specialItem은 동적 값이므로 생략
                    anyValue,
                    anyValue,
                    anyValue
                );
        });

        it('Should store mint snapshot', async function () {
            await contract.connect(user1).mint('ipfs://QmTest');

            const snapshot = await contract.mintSnapshots(1);
            expect(snapshot.totalWealthUSD).to.be.gt(0);
            expect(snapshot.timestamp).to.be.gt(0);
        });
    });

    describe('Special Items', function () {
        it('Should assign special item based on tier', async function () {
            const preview = await contract.previewMint(user1.address);

            if (preview.wealthTier === 0) {
                expect(preview.specialItem).to.equal(0);
            } else if (preview.wealthTier === 1) {
                expect(preview.specialItem).to.be.gte(1).and.lte(3);
            } else if (preview.wealthTier === 2) {
                expect(preview.specialItem).to.be.gte(4).and.lte(6);
            }
        });
    });
});
```

---

## 🚀 배포 스크립트

```typescript
// scripts/deploy.ts
import { ethers } from 'hardhat';

async function main() {
    console.log('Deploying MinecraftPFPWithWealth...');

    // 네트워크 확인
    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name} (${network.chainId})`);

    // 배포자 주소
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    // 배포자 잔액 확인
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

    // Price Feed 주소 설정 (네트워크별)
    let ethUsdFeed, usdtUsdFeed, usdcUsdFeed, usdt, usdc;

    if (network.chainId === 1n) {
        // Mainnet
        ethUsdFeed = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
        usdtUsdFeed = '0x3E7d1eAB13ad0104d273B42c5c5a4e3F3A9b6d3e';
        usdcUsdFeed = '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6';
        usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    } else if (network.chainId === 11155111n) {
        // Sepolia
        ethUsdFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
        usdtUsdFeed = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';
        usdcUsdFeed = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';
        usdt = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
        usdc = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
    } else {
        throw new Error(`Unsupported network: ${network.name}`);
    }

    // 컨트랙트 배포
    const MinecraftPFP = await ethers.getContractFactory('MinecraftPFPWithWealth');
    const contract = await MinecraftPFP.deploy(ethUsdFeed, usdtUsdFeed, usdcUsdFeed, usdt, usdc);

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`Contract deployed to: ${address}`);

    // 배포 정보 저장
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contract: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        priceFeeds: {
            ethUsd: ethUsdFeed,
            usdtUsd: usdtUsdFeed,
            usdcUsd: usdcUsdFeed,
        },
        tokens: {
            usdt: usdt,
            usdc: usdc,
        },
    };

    console.log('\nDeployment Info:');
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Etherscan 검증 안내
    console.log('\nTo verify on Etherscan:');
    console.log(`npx hardhat verify --network ${network.name} ${address} ${ethUsdFeed} ${usdtUsdFeed} ${usdcUsdFeed} ${usdt} ${usdc}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

---

## ⚙️ Hardhat 설정

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'dotenv/config';

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.20',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_RPC_URL || '',
                enabled: process.env.FORKING === 'true',
            },
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || '',
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        mainnet: {
            url: process.env.MAINNET_RPC_URL || '',
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
};

export default config;
```

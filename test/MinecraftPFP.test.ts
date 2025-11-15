import { expect } from 'chai';
import { ethers } from 'hardhat';
import { MinecraftPFPWithWealth, TraitGenerator } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('MinecraftPFPWithWealth', function () {
    let contract: MinecraftPFPWithWealth;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    // Price Feed addresses (Sepolia Testnet)
    const ETH_USD_FEED = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
    const USDT_USD_FEED = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';
    const USDC_USD_FEED = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';

    // Token addresses (Sepolia Testnet)
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
        await contract.waitForDeployment();
    });

    describe('배포', function () {
        it('올바른 소유자가 설정되어야 함', async function () {
            expect(await contract.owner()).to.equal(owner.address);
        });

        it('Price Feed가 올바르게 설정되어야 함', async function () {
            expect(await contract.ethUsdPriceFeed()).to.equal(ETH_USD_FEED);
            expect(await contract.usdtUsdPriceFeed()).to.equal(USDT_USD_FEED);
            expect(await contract.usdcUsdPriceFeed()).to.equal(USDC_USD_FEED);
        });

        it('토큰 주소가 올바르게 설정되어야 함', async function () {
            expect(await contract.USDT()).to.equal(USDT);
            expect(await contract.USDC()).to.equal(USDC);
        });

        it('초기 총 발행량은 0이어야 함', async function () {
            expect(await contract.totalSupply()).to.equal(0);
        });
    });

    describe('Trait 생성 (Deterministic)', function () {
        it('동일한 주소는 항상 동일한 속성을 생성해야 함', async function () {
            const preview1 = await contract.previewMint(user1.address);
            const preview2 = await contract.previewMint(user1.address);

            // 모든 속성이 동일해야 함
            expect(preview1.traits.hatStyle).to.equal(preview2.traits.hatStyle);
            expect(preview1.traits.hatColor).to.equal(preview2.traits.hatColor);
            expect(preview1.traits.hatOpacity).to.equal(preview2.traits.hatOpacity);

            expect(preview1.traits.clothesStyle).to.equal(preview2.traits.clothesStyle);
            expect(preview1.traits.clothesColor).to.equal(preview2.traits.clothesColor);
            expect(preview1.traits.clothesOpacity).to.equal(preview2.traits.clothesOpacity);

            expect(preview1.traits.shoesStyle).to.equal(preview2.traits.shoesStyle);
            expect(preview1.traits.shoesColor).to.equal(preview2.traits.shoesColor);
            expect(preview1.traits.shoesOpacity).to.equal(preview2.traits.shoesOpacity);

            expect(preview1.traits.pantsStyle).to.equal(preview2.traits.pantsStyle);
            expect(preview1.traits.pantsColor).to.equal(preview2.traits.pantsColor);
            expect(preview1.traits.pantsOpacity).to.equal(preview2.traits.pantsOpacity);

            expect(preview1.traits.skinTone).to.equal(preview2.traits.skinTone);
            expect(preview1.traits.skinShade).to.equal(preview2.traits.skinShade);
        });

        it('다른 주소는 다른 속성을 생성해야 함', async function () {
            const preview1 = await contract.previewMint(user1.address);
            const preview2 = await contract.previewMint(user2.address);

            // 최소한 하나 이상의 속성이 달라야 함
            const sameTraits =
                preview1.traits.hatStyle === preview2.traits.hatStyle &&
                preview1.traits.clothesStyle === preview2.traits.clothesStyle &&
                preview1.traits.shoesStyle === preview2.traits.shoesStyle &&
                preview1.traits.pantsStyle === preview2.traits.pantsStyle &&
                preview1.traits.skinTone === preview2.traits.skinTone;

            expect(sameTraits).to.be.false;
        });

        it('스타일 값이 올바른 범위 내에 있어야 함', async function () {
            const preview = await contract.previewMint(user1.address);

            expect(preview.traits.hatStyle).to.be.lte(9);
            expect(preview.traits.clothesStyle).to.be.lte(14);
            expect(preview.traits.shoesStyle).to.be.lte(7);
            expect(preview.traits.pantsStyle).to.be.lte(11);
            expect(preview.traits.skinTone).to.be.lte(5);
        });

        it('색상 계열이 올바른 범위 내에 있어야 함', async function () {
            const preview = await contract.previewMint(user1.address);

            expect(preview.traits.hatColor).to.be.lte(5);
            expect(preview.traits.clothesColor).to.be.lte(5);
            expect(preview.traits.shoesColor).to.be.lte(5);
            expect(preview.traits.pantsColor).to.be.lte(5);
        });

        it('투명도가 100-255 범위 내에 있어야 함', async function () {
            const preview = await contract.previewMint(user1.address);

            expect(preview.traits.hatOpacity).to.be.gte(100).and.lte(255);
            expect(preview.traits.clothesOpacity).to.be.gte(100).and.lte(255);
            expect(preview.traits.shoesOpacity).to.be.gte(100).and.lte(255);
            expect(preview.traits.pantsOpacity).to.be.gte(100).and.lte(255);
        });

        it('피부 명암이 0-49 범위 내에 있어야 함', async function () {
            const preview = await contract.previewMint(user1.address);
            expect(preview.traits.skinShade).to.be.lte(49);
        });
    });

    describe('Wealth 계산', function () {
        it('ETH 가격을 조회할 수 있어야 함', async function () {
            const price = await contract.getETHPriceUSD();
            expect(price).to.be.gt(0);
        });

        it('USDT 가격을 조회할 수 있어야 함', async function () {
            const price = await contract.getUSDTPriceUSD();
            expect(price).to.be.gt(0);
        });

        it('USDC 가격을 조회할 수 있어야 함', async function () {
            const price = await contract.getUSDCPriceUSD();
            expect(price).to.be.gt(0);
        });

        it('총 자산을 계산할 수 있어야 함', async function () {
            const preview = await contract.previewMint(user1.address);
            expect(preview.ethValueUSD).to.be.gte(0);
            expect(preview.totalWealthUSD).to.be.gte(0);
        });

        it('Wealth tier를 올바르게 결정해야 함', async function () {
            // Tier 0 (None)
            expect(await contract.getWealthTier(0)).to.equal(0);
            expect(await contract.getWealthTier(ethers.parseUnits('500', 8))).to.equal(0);

            // Tier 1 (Bronze) - $1,000+
            expect(await contract.getWealthTier(ethers.parseUnits('1000', 8))).to.equal(1);
            expect(await contract.getWealthTier(ethers.parseUnits('5000', 8))).to.equal(1);

            // Tier 2 (Silver) - $10,000+
            expect(await contract.getWealthTier(ethers.parseUnits('10000', 8))).to.equal(2);
            expect(await contract.getWealthTier(ethers.parseUnits('25000', 8))).to.equal(2);

            // Tier 3 (Gold) - $50,000+
            expect(await contract.getWealthTier(ethers.parseUnits('50000', 8))).to.equal(3);
            expect(await contract.getWealthTier(ethers.parseUnits('75000', 8))).to.equal(3);

            // Tier 4 (Platinum) - $100,000+
            expect(await contract.getWealthTier(ethers.parseUnits('100000', 8))).to.equal(4);
            expect(await contract.getWealthTier(ethers.parseUnits('250000', 8))).to.equal(4);

            // Tier 5 (Diamond) - $500,000+
            expect(await contract.getWealthTier(ethers.parseUnits('500000', 8))).to.equal(5);
            expect(await contract.getWealthTier(ethers.parseUnits('1000000', 8))).to.equal(5);
        });
    });

    describe('Special Item', function () {
        it('Tier 0은 아이템 0을 가져야 함', async function () {
            const item = await contract.getSpecialItemFromWealth(0, user1.address);
            expect(item).to.equal(0);
        });

        it('Tier 1은 아이템 1-3을 가져야 함', async function () {
            const item = await contract.getSpecialItemFromWealth(1, user1.address);
            expect(item).to.be.gte(1).and.lte(3);
        });

        it('Tier 2는 아이템 4-6을 가져야 함', async function () {
            const item = await contract.getSpecialItemFromWealth(2, user1.address);
            expect(item).to.be.gte(4).and.lte(6);
        });

        it('Tier 3은 아이템 7-10을 가져야 함', async function () {
            const item = await contract.getSpecialItemFromWealth(3, user1.address);
            expect(item).to.be.gte(7).and.lte(10);
        });

        it('Tier 4는 아이템 11-14를 가져야 함', async function () {
            const item = await contract.getSpecialItemFromWealth(4, user1.address);
            expect(item).to.be.gte(11).and.lte(14);
        });

        it('Tier 5는 아이템 15-19를 가져야 함', async function () {
            const item = await contract.getSpecialItemFromWealth(5, user1.address);
            expect(item).to.be.gte(15).and.lte(19);
        });

        it('동일한 주소와 tier는 동일한 아이템을 생성해야 함', async function () {
            const item1 = await contract.getSpecialItemFromWealth(3, user1.address);
            const item2 = await contract.getSpecialItemFromWealth(3, user1.address);
            expect(item1).to.equal(item2);
        });
    });

    describe('민팅', function () {
        it('NFT를 성공적으로 민팅할 수 있어야 함', async function () {
            const ipfsUri = 'ipfs://QmTest123';
            const tx = await contract.connect(user1).mint(ipfsUri);
            await tx.wait();

            expect(await contract.ownerOf(1)).to.equal(user1.address);
            expect(await contract.tokenURI(1)).to.equal(ipfsUri);
            expect(await contract.totalSupply()).to.equal(1);
        });

        it('중복 민팅을 방지해야 함', async function () {
            await contract.connect(user1).mint('ipfs://QmTest1');

            await expect(contract.connect(user1).mint('ipfs://QmTest2'))
                .to.be.revertedWith('Already minted');
        });

        it('빈 URI로 민팅할 수 없어야 함', async function () {
            await expect(contract.connect(user1).mint(''))
                .to.be.revertedWith('Empty URI');
        });

        it('NFTMinted 이벤트를 발생시켜야 함', async function () {
            await expect(contract.connect(user1).mint('ipfs://QmTest'))
                .to.emit(contract, 'NFTMinted');
        });

        it('WealthCalculated 이벤트를 발생시켜야 함', async function () {
            await expect(contract.connect(user1).mint('ipfs://QmTest'))
                .to.emit(contract, 'WealthCalculated');
        });

        it('민팅 스냅샷을 저장해야 함', async function () {
            await contract.connect(user1).mint('ipfs://QmTest');

            const snapshot = await contract.mintSnapshots(1);
            expect(snapshot.totalWealthUSD).to.be.gte(0);
            expect(snapshot.timestamp).to.be.gt(0);
            expect(snapshot.ethBalance).to.equal(await ethers.provider.getBalance(user1.address));
        });

        it('ownerToToken 매핑을 업데이트해야 함', async function () {
            await contract.connect(user1).mint('ipfs://QmTest');
            expect(await contract.ownerToToken(user1.address)).to.equal(1);
        });

        it('여러 사용자가 각각 민팅할 수 있어야 함', async function () {
            await contract.connect(user1).mint('ipfs://QmTest1');
            await contract.connect(user2).mint('ipfs://QmTest2');

            expect(await contract.ownerOf(1)).to.equal(user1.address);
            expect(await contract.ownerOf(2)).to.equal(user2.address);
            expect(await contract.totalSupply()).to.equal(2);
        });
    });

    describe('토큰 조회', function () {
        beforeEach(async function () {
            await contract.connect(user1).mint('ipfs://QmTest');
        });

        it('토큰 정보를 조회할 수 있어야 함', async function () {
            const info = await contract.getTokenInfo(1);

            expect(info.owner).to.equal(user1.address);
            expect(info.totalWealthUSD).to.be.gte(0);
            expect(info.wealthTier).to.be.lte(5);
            expect(info.mintTimestamp).to.be.gt(0);
        });

        it('존재하지 않는 토큰 조회 시 에러가 발생해야 함', async function () {
            await expect(contract.getTokenInfo(999))
                .to.be.revertedWith('Token does not exist');
        });

        it('토큰의 속성은 소유자 주소와 일치해야 함', async function () {
            const info = await contract.getTokenInfo(1);
            const preview = await contract.previewMint(user1.address);

            expect(info.traits.hatStyle).to.equal(preview.traits.hatStyle);
            expect(info.traits.clothesStyle).to.equal(preview.traits.clothesStyle);
        });
    });

    describe('URI 업데이트', function () {
        beforeEach(async function () {
            await contract.connect(user1).mint('ipfs://QmTest');
        });

        it('소유자가 URI를 업데이트할 수 있어야 함', async function () {
            const newUri = 'ipfs://QmNewTest';
            await contract.connect(user1).updateTokenURI(1, newUri);
            expect(await contract.tokenURI(1)).to.equal(newUri);
        });

        it('비소유자는 URI를 업데이트할 수 없어야 함', async function () {
            await expect(contract.connect(user2).updateTokenURI(1, 'ipfs://QmNewTest'))
                .to.be.revertedWith('Not token owner');
        });

        it('빈 URI로 업데이트할 수 없어야 함', async function () {
            await expect(contract.connect(user1).updateTokenURI(1, ''))
                .to.be.revertedWith('Empty URI');
        });
    });

    describe('Preview 기능', function () {
        it('민팅 전에 미리보기를 할 수 있어야 함', async function () {
            const preview = await contract.previewMint(user1.address);

            expect(preview.traits.hatStyle).to.be.lte(9);
            expect(preview.totalWealthUSD).to.be.gte(0);
            expect(preview.wealthTier).to.be.lte(5);
            expect(preview.specialItem).to.be.gte(0).and.lte(19);
        });

        it('미리보기와 실제 민팅 속성이 일치해야 함', async function () {
            const preview = await contract.previewMint(user1.address);
            await contract.connect(user1).mint('ipfs://QmTest');
            const info = await contract.getTokenInfo(1);

            expect(info.traits.hatStyle).to.equal(preview.traits.hatStyle);
            expect(info.traits.clothesStyle).to.equal(preview.traits.clothesStyle);
            expect(info.wealthTier).to.equal(preview.wealthTier);
        });
    });
});

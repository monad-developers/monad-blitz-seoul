import { ethers } from 'hardhat';

/**
 * Monad Penguins 테스트 민팅 스크립트
 *
 * 배포된 컨트랙트에서 테스트 민팅을 수행하는 스크립트
 *
 * 사용법:
 * MONAD_PENGUINS_ADDRESS=0x...
 * npx hardhat run scripts/test-mint-penguin.ts --network sepolia
 */
async function main() {
    console.log('🐧 Monad Penguins 테스트 민팅 시작...\n');

    // 환경 변수에서 컨트랙트 주소 가져오기
    const contractAddress = process.env.MONAD_PENGUINS_ADDRESS;

    if (!contractAddress) {
        throw new Error('❌ MONAD_PENGUINS_ADDRESS 환경 변수가 설정되지 않았습니다.');
    }

    console.log(`📍 Contract Address: ${contractAddress}\n`);

    // 네트워크 확인
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // 민터 주소
    const [minter] = await ethers.getSigners();
    console.log(`👤 Minter: ${minter.address}`);

    // 잔액 확인
    const balance = await ethers.provider.getBalance(minter.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

    // 컨트랙트 연결
    console.log('⏳ 컨트랙트 연결 중...');
    const MonadPenguins = await ethers.getContractFactory('MonadPenguins');
    const contract = MonadPenguins.attach(contractAddress);

    // 민팅 전 상태 확인
    const mintPrice = await contract.MINT_PRICE();
    const totalSupplyBefore = await contract.totalSupply();
    const mintingEnabled = await contract.mintingEnabled();

    console.log('📋 민팅 전 상태:');
    console.log(`  Mint Price:      ${ethers.formatEther(mintPrice)} ETH`);
    console.log(`  Total Supply:    ${totalSupplyBefore.toString()}`);
    console.log(`  Minting Enabled: ${mintingEnabled}\n`);

    if (!mintingEnabled) {
        throw new Error('❌ 민팅이 비활성화되어 있습니다.');
    }

    // 민팅 가격 확인
    if (balance < mintPrice) {
        throw new Error(`❌ 잔액 부족: ${ethers.formatEther(mintPrice)} ETH 필요 (현재: ${ethers.formatEther(balance)} ETH)`);
    }

    // 민팅 수행
    console.log('⏳ 민팅 중...');
    const tx = await contract.mint({ value: mintPrice });
    console.log(`📝 Transaction Hash: ${tx.hash}`);

    console.log('⏳ 트랜잭션 대기 중...');
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    // 이벤트에서 토큰 ID 추출
    const mintEvent = receipt.logs
        .map((log: any) => {
            try {
                return contract.interface.parseLog(log);
            } catch {
                return null;
            }
        })
        .find((event: any) => event && event.name === 'PenguinMinted');

    if (!mintEvent) {
        throw new Error('❌ PenguinMinted 이벤트를 찾을 수 없습니다.');
    }

    const tokenId = mintEvent.args.tokenId;
    const rescueNumber = mintEvent.args.rescueNumber;
    const rarity = mintEvent.args.rarity;

    console.log('🎉 민팅 성공!');
    console.log(`  Token ID:      #${tokenId.toString()}`);
    console.log(`  Rescue Number: ${rescueNumber.toString()}`);
    console.log(`  Rarity:        ${getRarityName(rarity)}\n`);

    // 민팅 후 상태 확인
    const totalSupplyAfter = await contract.totalSupply();
    const tokenOwner = await contract.ownerOf(tokenId);
    const traits = await contract.getTraits(tokenId);

    console.log('📋 민팅 후 상태:');
    console.log(`  Total Supply:  ${totalSupplyAfter.toString()}`);
    console.log(`  Token Owner:   ${tokenOwner}\n`);

    console.log('🐧 펭귄 Traits:');
    console.log(`  Body Color:    ${traits.bodyColor} ${getBodyColorName(traits.bodyColor)}`);
    console.log(`  Beak Type:     ${traits.beakType} ${getBeakTypeName(traits.beakType)}`);
    console.log(`  Eye Type:      ${traits.eyeType} ${getEyeTypeName(traits.eyeType)}`);
    console.log(`  Accessory:     ${traits.accessory} ${getAccessoryName(traits.accessory)}`);
    console.log(`  Background:    ${traits.background} ${getBackgroundName(traits.background)}`);
    console.log(`  Rarity:        ${traits.rarity} ${getRarityName(traits.rarity)}`);
    console.log(`  Rescue Number: ${traits.rescueNumber.toString()}\n`);

    // 컨트랙트 잔액
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`💰 컨트랙트 잔액: ${ethers.formatEther(contractBalance)} ETH\n`);

    console.log('✨ 테스트 민팅 완료!');
}

// Helper functions
function getRarityName(rarity: number): string {
    const names = ['Common', 'Rare', 'Epic', 'Legendary'];
    return names[rarity] || 'Unknown';
}

function getBodyColorName(color: number): string {
    const names = [
        'Classic White & Black',
        'Ice Blue',
        'Glacier Gray',
        'Aurora Purple',
        'Snow White',
        'Midnight Black',
        'Frost Silver',
        'Ocean Blue',
        'Sunset Orange',
        'Golden Shimmer',
    ];
    return names[color] || 'Unknown';
}

function getBeakTypeName(type: number): string {
    const names = ['Standard Orange', 'Long & Sharp', 'Short & Round', 'Golden Beak', 'Ice Crystal'];
    return names[type] || 'Unknown';
}

function getEyeTypeName(type: number): string {
    const names = [
        'Curious Eyes',
        'Sleepy Eyes',
        'Sparkling Eyes',
        'Angry Eyes',
        'Heart Eyes',
        'X Eyes',
        'Laser Eyes',
    ];
    return names[type] || 'Unknown';
}

function getAccessoryName(accessory: number): string {
    const names = [
        'None',
        'Red Scarf',
        'Top Hat',
        'Snow Goggles',
        'Crown',
        'Bow Tie',
        'Backpack',
        'Wings',
        'Fish',
        'Snowflake',
    ];
    return names[accessory] || 'Unknown';
}

function getBackgroundName(background: number): string {
    const names = [
        'Ice Cave',
        'Blizzard',
        'Aurora Borealis',
        'Frozen Ocean',
        'Snowy Mountain',
        'Ice Block',
        'Glacier',
        'Starry Night',
    ];
    return names[background] || 'Unknown';
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 실패:', error);
        process.exit(1);
    });

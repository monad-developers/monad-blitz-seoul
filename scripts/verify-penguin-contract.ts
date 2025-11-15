import { ethers } from 'hardhat';

/**
 * Monad Penguins 컨트랙트 검증 스크립트
 *
 * 배포된 컨트랙트의 상태와 기능을 확인하는 스크립트
 *
 * 사용법:
 * MONAD_PENGUINS_ADDRESS=0x...
 * npx hardhat run scripts/verify-penguin-contract.ts --network sepolia
 */
async function main() {
    console.log('🔍 Monad Penguins 컨트랙트 검증 시작...\n');

    // 환경 변수에서 컨트랙트 주소 가져오기
    const contractAddress = process.env.MONAD_PENGUINS_ADDRESS;

    if (!contractAddress) {
        throw new Error('❌ MONAD_PENGUINS_ADDRESS 환경 변수가 설정되지 않았습니다.');
    }

    console.log(`📍 Contract Address: ${contractAddress}\n`);

    // 네트워크 확인
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // 컨트랙트 연결
    console.log('⏳ 컨트랙트 연결 중...');
    const MonadPenguins = await ethers.getContractFactory('MonadPenguins');
    const contract = MonadPenguins.attach(contractAddress);
    console.log('✅ 컨트랙트 연결 완료\n');

    // 기본 정보 확인
    console.log('═══════════════════════════════════════');
    console.log('📋 기본 정보');
    console.log('═══════════════════════════════════════');

    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    const maxSupply = await contract.MAX_SUPPLY();
    const mintPrice = await contract.MINT_PRICE();
    const mintingEnabled = await contract.mintingEnabled();
    const baseTokenURI = await contract.baseTokenURI();

    console.log(`Name:            ${name}`);
    console.log(`Symbol:          ${symbol}`);
    console.log(`Owner:           ${owner}`);
    console.log(`Max Supply:      ${maxSupply.toString()}`);
    console.log(`Mint Price:      ${ethers.formatEther(mintPrice)} ETH`);
    console.log(`Minting Enabled: ${mintingEnabled}`);
    console.log(`Base Token URI:  ${baseTokenURI}\n`);

    // 공급량 정보
    console.log('═══════════════════════════════════════');
    console.log('📊 공급량 정보');
    console.log('═══════════════════════════════════════');

    const totalSupply = await contract.totalSupply();
    const remainingSupply = await contract.remainingSupply();
    const mintedPercentage = (Number(totalSupply) / Number(maxSupply) * 100).toFixed(2);

    console.log(`Total Minted:    ${totalSupply.toString()} / ${maxSupply.toString()}`);
    console.log(`Remaining:       ${remainingSupply.toString()}`);
    console.log(`Progress:        ${mintedPercentage}%\n`);

    // 희귀도 분포 (민팅된 NFT가 있을 경우에만)
    if (totalSupply > 0n) {
        console.log('═══════════════════════════════════════');
        console.log('✨ 희귀도 분포');
        console.log('═══════════════════════════════════════');

        const rarityNames = ['Common', 'Rare', 'Epic', 'Legendary'];
        const rarityCounts = await Promise.all([
            contract.getRarityCount(0),
            contract.getRarityCount(1),
            contract.getRarityCount(2),
            contract.getRarityCount(3),
        ]);

        for (let i = 0; i < 4; i++) {
            const count = rarityCounts[i];
            const percentage = totalSupply > 0n
                ? (Number(count) / Number(totalSupply) * 100).toFixed(2)
                : '0.00';
            console.log(`${rarityNames[i].padEnd(12)} ${count.toString().padStart(4)} (${percentage}%)`);
        }

        console.log('');

        // 샘플 NFT 정보 (처음 3개)
        console.log('═══════════════════════════════════════');
        console.log('🐧 샘플 NFT (처음 3개)');
        console.log('═══════════════════════════════════════');

        const sampleCount = totalSupply < 3n ? Number(totalSupply) : 3;
        for (let i = 1; i <= sampleCount; i++) {
            const traits = await contract.getTraits(i);
            const tokenOwner = await contract.ownerOf(i);

            console.log(`\nToken ID #${i}:`);
            console.log(`  Owner:       ${tokenOwner}`);
            console.log(`  Body Color:  ${traits.bodyColor}`);
            console.log(`  Beak Type:   ${traits.beakType}`);
            console.log(`  Eye Type:    ${traits.eyeType}`);
            console.log(`  Accessory:   ${traits.accessory}`);
            console.log(`  Background:  ${traits.background}`);
            console.log(`  Rarity:      ${rarityNames[traits.rarity]} (${traits.rarity})`);
            console.log(`  Rescue #:    ${traits.rescueNumber.toString()}`);
        }

        console.log('');
    }

    // 컨트랙트 잔액
    console.log('═══════════════════════════════════════');
    console.log('💰 컨트랙트 잔액');
    console.log('═══════════════════════════════════════');

    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(`Balance: ${ethers.formatEther(contractBalance)} ETH\n`);

    // 검증 완료
    console.log('✅ 검증 완료!');
    console.log('\n📌 다음 단계:');

    if (baseTokenURI.includes('QmTempBaseURI')) {
        console.log('  1. IPFS에 메타데이터 업로드');
        console.log('  2. Base URI 업데이트 스크립트 실행');
    }

    if (!mintingEnabled) {
        console.log('  ⚠️  민팅이 비활성화되어 있습니다. setMintingEnabled(true) 호출 필요');
    }

    if (totalSupply === 0n) {
        console.log('  3. 테스트 민팅 실행');
    }

    console.log('\n✨ 완료!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 실패:', error);
        process.exit(1);
    });

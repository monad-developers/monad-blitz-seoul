const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const { getMonadDeployConfig, validateMonadTokens } = require('../src/config/monad');

async function main() {
    console.log('🚀 MinecraftPFPWithWealth 배포 시작...\n');

    // 네트워크 확인
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // 배포자 주소
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // 배포자 잔액 확인
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

    // Price Feed 주소 설정 (네트워크별)
    let solUsdFeed;
    let sol;

    if (network.chainId === 1n) {
        // Ethereum Mainnet (사용 안 함)
        throw new Error('❌ Mainnet에서는 지원되지 않습니다. Monad Testnet을 사용하세요.');
    } else if (network.chainId === 11155111n) {
        // Sepolia Testnet (사용 안 함)
        throw new Error('❌ Sepolia에서는 지원되지 않습니다. Monad Testnet을 사용하세요.');
    } else if (network.chainId === 10143n) {
        // Monad Testnet - SOL/USD Price Feed 사용
        console.log('🔷 Monad Testnet - SOL/USD Price Feed 사용\n');

        // Config에서 설정 가져오기
        const config = getMonadDeployConfig();

        solUsdFeed = config.solUsdFeed;
        sol = config.sol;

        // 토큰 주소 검증
        const validation = validateMonadTokens();
        if (!validation.valid) {
            console.log('⚠️  경고: 토큰 주소 설정 필요\n');
            validation.errors.forEach(error => console.log(`   - ${error}`));
            console.log('\n   src/config/monad.ts 파일을 확인하세요.\n');
        }
    } else {
        throw new Error(`❌ 지원하지 않는 네트워크: ${network.name} (Chain ID: ${network.chainId})`);
    }

    console.log('\n📋 설정 정보:');
    console.log(`  SOL/USD Feed: ${solUsdFeed}`);
    console.log(`  SOL: ${sol}\n`);

    // 컨트랙트 배포
    console.log('⏳ 컨트랙트 배포 중...');
    const MinecraftPFP = await ethers.getContractFactory('MinecraftPFPWithWealth');
    const contract = await MinecraftPFP.deploy(solUsdFeed, sol);

    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${address}\n`);

    // 배포 정보 저장
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contract: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        priceFeeds: {
            solUsd: solUsdFeed,
        },
        tokens: {
            sol: sol,
        },
    };

    // deployments 디렉토리 생성
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // 배포 정보를 파일로 저장
    const filename = `${network.name}_${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log('📝 배포 정보:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 배포 정보가 저장되었습니다: ${filepath}`);

    // Etherscan 검증 안내
    console.log('\n🔍 Etherscan 검증 명령어:');
    console.log(`npx hardhat verify --network ${network.name} ${address} ${solUsdFeed} ${sol}`);

    console.log('\n✨ 배포 완료!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 배포 실패:', error);
        process.exit(1);
    });

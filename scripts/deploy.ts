import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { getMonadDeployConfig, validateMonadTokens } from '../src/config/monad';

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
    let ethUsdFeed: string;
    let usdtUsdFeed: string;
    let usdcUsdFeed: string;
    let usdt: string;
    let usdc: string;

    if (network.chainId === 1n) {
        // Ethereum Mainnet
        console.log('🌐 Ethereum Mainnet 설정 사용');
        ethUsdFeed = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
        usdtUsdFeed = '0x3E7d1eAB13ad0104d273B42c5c5a4e3F3A9b6d3e';
        usdcUsdFeed = '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6';
        usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    } else if (network.chainId === 11155111n) {
        // Sepolia Testnet
        console.log('🧪 Sepolia Testnet 설정 사용');
        ethUsdFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
        usdtUsdFeed = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';
        usdcUsdFeed = '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E';
        usdt = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';
        usdc = '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8';
    } else if (network.chainId === 10143n) {
        // Monad Testnet
        console.log('🔷 Monad Testnet - Chainlink Price Feeds 사용\n');

        // Config에서 설정 가져오기
        const config = getMonadDeployConfig();

        ethUsdFeed = config.ethUsdFeed;
        usdtUsdFeed = config.usdtUsdFeed;
        usdcUsdFeed = config.usdcUsdFeed;
        usdt = config.usdt;
        usdc = config.usdc;

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
    console.log(`  ETH/USD Feed: ${ethUsdFeed}`);
    console.log(`  USDT/USD Feed: ${usdtUsdFeed}`);
    console.log(`  USDC/USD Feed: ${usdcUsdFeed}`);
    console.log(`  USDT: ${usdt}`);
    console.log(`  USDC: ${usdc}\n`);

    // 컨트랙트 배포
    console.log('⏳ 컨트랙트 배포 중...');
    const MinecraftPFP = await ethers.getContractFactory('MinecraftPFPWithWealth');
    const contract = await MinecraftPFP.deploy(ethUsdFeed, usdtUsdFeed, usdcUsdFeed, usdt, usdc);

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
            ethUsd: ethUsdFeed,
            usdtUsd: usdtUsdFeed,
            usdcUsd: usdcUsdFeed,
        },
        tokens: {
            usdt: usdt,
            usdc: usdc,
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
    console.log(`npx hardhat verify --network ${network.name} ${address} ${ethUsdFeed} ${usdtUsdFeed} ${usdcUsdFeed} ${usdt} ${usdc}`);

    console.log('\n✨ 배포 완료!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 배포 실패:', error);
        process.exit(1);
    });

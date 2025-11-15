import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

/**
 * Monad Penguins NFT 컬렉션 배포 스크립트
 *
 * 배포 네트워크: Ethereum Sepolia Testnet
 * 용도: Sepolia에서 펭귄 NFT를 소유한 사람이 Monad에서 특수 trait을 받을 수 있는 크로스체인 시스템
 */
async function main() {
    console.log('🐧 Monad Penguins NFT 컬렉션 배포 시작...\n');

    // 네트워크 확인
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

    // Sepolia 네트워크 확인
    if (network.chainId !== 11155111n) {
        console.log('\n⚠️  경고: 이 스크립트는 Sepolia 테스트넷용입니다.');
        console.log(`   현재 네트워크: ${network.name} (Chain ID: ${network.chainId})`);
        console.log('\n   배포를 계속하려면 Ctrl+C를 눌러 취소하거나, 계속 진행합니다...\n');
    }

    // 배포자 주소
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    // 배포자 잔액 확인
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    // 최소 잔액 확인 (0.01 ETH)
    const minBalance = ethers.parseEther('0.01');
    if (balance < minBalance) {
        throw new Error(`❌ 잔액 부족: 최소 0.01 ETH 필요 (현재: ${ethers.formatEther(balance)} ETH)`);
    }

    console.log('✅ 잔액 확인 완료\n');

    // Base URI 설정
    // 메타데이터는 IPFS에 업로드될 예정이므로 임시 URI 사용
    // 배포 후 setBaseTokenURI()로 업데이트 필요
    const baseTokenURI = process.env.MONAD_PENGUINS_BASE_URI || 'ipfs://QmTempBaseURI/';
    console.log(`📋 설정 정보:`);
    console.log(`  Base Token URI: ${baseTokenURI}`);
    console.log(`  Max Supply: 1,000`);
    console.log(`  Mint Price: 0.001 ETH\n`);

    // 컨트랙트 배포
    console.log('⏳ MonadPenguins 컨트랙트 배포 중...');
    const MonadPenguins = await ethers.getContractFactory('MonadPenguins');
    const contract = await MonadPenguins.deploy(baseTokenURI);

    console.log('⏳ 배포 트랜잭션 대기 중...');
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${address}\n`);

    // 배포 정보 확인
    console.log('🔍 컨트랙트 정보 확인 중...');
    const name = await contract.name();
    const symbol = await contract.symbol();
    const maxSupply = await contract.MAX_SUPPLY();
    const mintPrice = await contract.MINT_PRICE();
    const totalSupply = await contract.totalSupply();

    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Max Supply: ${maxSupply.toString()}`);
    console.log(`  Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
    console.log(`  Total Minted: ${totalSupply.toString()}\n`);

    // 배포 정보 저장
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contract: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contractDetails: {
            name: name,
            symbol: symbol,
            maxSupply: maxSupply.toString(),
            mintPrice: ethers.formatEther(mintPrice),
            baseTokenURI: baseTokenURI,
        },
    };

    // deployments 디렉토리 생성
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // 배포 정보를 파일로 저장
    const filename = `monad-penguins_${network.name}_${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log('📝 배포 정보:');
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 배포 정보가 저장되었습니다: ${filepath}`);

    // 환경 변수 업데이트 안내
    console.log('\n📌 다음 단계:');
    console.log('\n1. .env 파일에 컨트랙트 주소 추가:');
    console.log(`   NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS=${address}`);

    console.log('\n2. IPFS에 메타데이터 업로드 후 Base URI 업데이트:');
    console.log(`   npx hardhat run scripts/update-penguin-uri.ts --network sepolia`);

    console.log('\n3. NFTOwnershipVerifier에 MonadPenguins 추가:');
    console.log(`   컨트랙트 주소: ${address}`);

    // Etherscan 검증 안내
    console.log('\n🔍 Etherscan 검증 명령어:');
    console.log(`npx hardhat verify --network sepolia ${address} "${baseTokenURI}"`);

    console.log('\n✨ 배포 완료!');
    console.log('\n🐧 Monad Penguins NFT 컬렉션이 성공적으로 배포되었습니다!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 배포 실패:', error);
        process.exit(1);
    });

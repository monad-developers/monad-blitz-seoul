import { ethers } from 'hardhat';

/**
 * Monad Penguins Base URI 업데이트 스크립트
 *
 * IPFS에 메타데이터를 업로드한 후 Base URI를 업데이트하는 스크립트
 *
 * 사용법:
 * MONAD_PENGUINS_ADDRESS=0x... MONAD_PENGUINS_BASE_URI=ipfs://Qm.../
 * npx hardhat run scripts/update-penguin-uri.ts --network sepolia
 */
async function main() {
    console.log('🔧 Monad Penguins Base URI 업데이트 시작...\n');

    // 환경 변수에서 컨트랙트 주소와 새 URI 가져오기
    const contractAddress = process.env.MONAD_PENGUINS_ADDRESS;
    const newBaseURI = process.env.MONAD_PENGUINS_BASE_URI;

    if (!contractAddress) {
        throw new Error('❌ MONAD_PENGUINS_ADDRESS 환경 변수가 설정되지 않았습니다.');
    }

    if (!newBaseURI) {
        throw new Error('❌ MONAD_PENGUINS_BASE_URI 환경 변수가 설정되지 않았습니다.');
    }

    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 New Base URI: ${newBaseURI}\n`);

    // 네트워크 확인
    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

    // 배포자 주소
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Signer: ${deployer.address}\n`);

    // 컨트랙트 연결
    console.log('⏳ 컨트랙트 연결 중...');
    const MonadPenguins = await ethers.getContractFactory('MonadPenguins');
    const contract = MonadPenguins.attach(contractAddress);

    // 현재 Base URI 확인
    console.log('🔍 현재 Base URI 확인 중...');
    const currentBaseURI = await contract.baseTokenURI();
    console.log(`  Current: ${currentBaseURI}`);
    console.log(`  New:     ${newBaseURI}\n`);

    // 소유자 확인
    const owner = await contract.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        throw new Error(`❌ 권한 없음: 컨트랙트 소유자가 아닙니다.\n  Owner: ${owner}\n  Signer: ${deployer.address}`);
    }

    console.log('✅ 소유자 확인 완료\n');

    // Base URI 업데이트
    console.log('⏳ Base URI 업데이트 중...');
    const tx = await contract.setBaseTokenURI(newBaseURI);
    console.log(`📝 Transaction Hash: ${tx.hash}`);

    console.log('⏳ 트랜잭션 대기 중...');
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

    // 업데이트 확인
    console.log('🔍 업데이트 확인 중...');
    const updatedBaseURI = await contract.baseTokenURI();
    console.log(`  Updated Base URI: ${updatedBaseURI}\n`);

    if (updatedBaseURI === newBaseURI) {
        console.log('✅ Base URI가 성공적으로 업데이트되었습니다!');
    } else {
        console.log('⚠️  경고: Base URI가 예상과 다릅니다.');
        console.log(`  Expected: ${newBaseURI}`);
        console.log(`  Actual:   ${updatedBaseURI}`);
    }

    console.log('\n✨ 완료!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 실패:', error);
        process.exit(1);
    });

# Hardhat 스크립트 JavaScript 변환 - 남은 작업

**날짜**: 2025-01-15
**상태**: deploy-monad-penguins.js 부터 시작

---

## ✅ 완료된 작업

1. ✅ `deploy.ts` → `deploy.js` 변환 완료
2. ✅ `deploy-ccip.ts` → `deploy-ccip.js` 변환 완료
3. ✅ `.ts` 파일 모두 삭제 완료

---

## 🔧 남은 작업

### 1. deploy-monad-penguins.js 완성

**파일**: `scripts/deploy-monad-penguins.js`
**상태**: 빈 파일로 생성됨
**작업**: 아래 내용으로 파일 작성

```javascript
const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🐧 Monad Penguins NFT 컬렉션 배포 시작...\n');

    const network = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

    if (network.chainId !== 11155111n) {
        console.log('\n⚠️  경고: 이 스크립트는 Sepolia 테스트넷용입니다.');
    }

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    const minBalance = ethers.parseEther('0.01');
    if (balance < minBalance) {
        throw new Error('❌ 잔액 부족: 최소 0.01 ETH 필요');
    }

    const baseTokenURI = process.env.MONAD_PENGUINS_BASE_URI || 'ipfs://QmTempBaseURI/';

    console.log('⏳ MonadPenguins 컨트랙트 배포 중...');
    const MonadPenguins = await ethers.getContractFactory('MonadPenguins');
    const contract = await MonadPenguins.deploy(baseTokenURI);

    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${address}\n`);

    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contract: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `monad-penguins_${network.name}_${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n💾 배포 정보가 저장되었습니다: ${filepath}`);
    console.log(`\n🔍 Etherscan 검증: npx hardhat verify --network sepolia ${address} "${baseTokenURI}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 배포 실패:', error);
        process.exit(1);
    });
```

---

### 2. update-penguin-uri.js 생성 (선택사항)

**원본**: `scripts/update-penguin-uri.ts` (이미 삭제됨)
**필요성**: 배포 후 Base URI 업데이트용
**작업**: 필요시 아래 내용으로 생성

```javascript
const { ethers } = require('hardhat');

async function main() {
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS;
    const NEW_BASE_URI = process.env.MONAD_PENGUINS_BASE_URI;

    if (!CONTRACT_ADDRESS) {
        throw new Error('NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS not set');
    }

    if (!NEW_BASE_URI) {
        throw new Error('MONAD_PENGUINS_BASE_URI not set');
    }

    console.log('🔧 Base URI 업데이트 중...');
    console.log(`Contract: ${CONTRACT_ADDRESS}`);
    console.log(`New URI: ${NEW_BASE_URI}`);

    const contract = await ethers.getContractAt('MonadPenguins', CONTRACT_ADDRESS);

    const tx = await contract.setBaseTokenURI(NEW_BASE_URI);
    await tx.wait();

    console.log('✅ Base URI 업데이트 완료!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 실패:', error);
        process.exit(1);
    });
```

---

### 3. verify-penguin-contract.js 생성 (선택사항)

**원본**: `scripts/verify-penguin-contract.ts` (이미 삭제됨)
**필요성**: 컨트랙트 검증 및 상태 확인용
**작업**: 필요시 아래 내용으로 생성

```javascript
const { ethers } = require('hardhat');

async function main() {
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS;

    if (!CONTRACT_ADDRESS) {
        throw new Error('NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS not set');
    }

    console.log('🔍 MonadPenguins 컨트랙트 검증 중...\n');
    console.log(`Contract: ${CONTRACT_ADDRESS}`);

    const contract = await ethers.getContractAt('MonadPenguins', CONTRACT_ADDRESS);

    // 기본 정보
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    const maxSupply = await contract.MAX_SUPPLY();
    const mintPrice = await contract.MINT_PRICE();
    const totalSupply = await contract.totalSupply();

    console.log('\n📋 컨트랙트 정보:');
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Owner: ${owner}`);
    console.log(`  Max Supply: ${maxSupply}`);
    console.log(`  Mint Price: ${ethers.formatEther(mintPrice)} ETH`);
    console.log(`  Total Minted: ${totalSupply}`);

    console.log('\n✅ 검증 완료!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 실패:', error);
        process.exit(1);
    });
```

---

### 4. test-mint-penguin.js 생성 (선택사항)

**원본**: `scripts/test-mint-penguin.ts` (이미 삭제됨)
**필요성**: 민팅 테스트용
**작업**: 필요시 아래 내용으로 생성

```javascript
const { ethers } = require('hardhat');

async function main() {
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS;

    if (!CONTRACT_ADDRESS) {
        throw new Error('NEXT_PUBLIC_MONAD_PENGUINS_ADDRESS not set');
    }

    console.log('🧪 민팅 테스트 시작...\n');

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt('MonadPenguins', CONTRACT_ADDRESS);

    const mintPrice = await contract.MINT_PRICE();
    console.log(`Mint Price: ${ethers.formatEther(mintPrice)} ETH`);

    console.log('⏳ 민팅 중...');
    const tx = await contract.mint({ value: mintPrice });
    await tx.wait();

    const totalSupply = await contract.totalSupply();
    console.log(`✅ 민팅 완료! Token ID: ${totalSupply}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 실패:', error);
        process.exit(1);
    });
```

---

## 📋 실행 순서

1. **deploy-monad-penguins.js 완성**
   ```bash
   # 위 코드를 scripts/deploy-monad-penguins.js에 작성
   ```

2. **(선택사항) 나머지 스크립트 생성**
   - update-penguin-uri.js
   - verify-penguin-contract.js
   - test-mint-penguin.js

3. **테스트 실행**
   ```bash
   # 배포 테스트
   npx hardhat run scripts/deploy-monad-penguins.js --network sepolia
   ```

---

## ⚠️ 주의사항

- **필수 스크립트**: `deploy.js`, `deploy-ccip.js`, `deploy-monad-penguins.js`
- **선택 스크립트**: update, verify, test 스크립트는 필요시 생성
- **환경 변수**: 배포 전 .env.local 설정 필요
- **네트워크**: Sepolia는 11155111n, Monad는 10143n

---

**작성일**: 2025-01-15
**다음 작업**: deploy-monad-penguins.js 완성부터 시작

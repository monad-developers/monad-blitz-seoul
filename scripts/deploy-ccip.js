const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * CCIP 컨트랙트 배포 스크립트
 *
 * 배포 순서:
 * 1. Sepolia에 NFTOwnershipVerifier 배포
 * 2. 지원 NFT 컬렉션 등록
 * 3. Monad에 MonadCCIPReceiver 배포
 * 4. 신뢰할 수 있는 Verifier 설정
 * 5. MinecraftPFP에 CCIPReceiver 연결
 */

async function main() {
  console.log("🚀 CCIP Deployment Starting...\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;

  console.log(`📍 Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // 환경 변수 확인
  const SEPOLIA_CCIP_ROUTER = process.env.SEPOLIA_CCIP_ROUTER;
  const MONAD_CCIP_ROUTER = process.env.NEXT_PUBLIC_MONAD_CCIP_ROUTER;
  const SEPOLIA_NFT_CONTRACT = process.env.NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT;
  const SEPOLIA_CHAIN_SELECTOR = process.env.SEPOLIA_CHAIN_SELECTOR;
  const MONAD_CHAIN_SELECTOR = process.env.NEXT_PUBLIC_MONAD_CHAIN_SELECTOR;
  const MINECRAFT_PFP_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  // Sepolia에 배포하는 경우
  if (networkName === "sepolia" || network.chainId === BigInt(11155111)) {
    if (!SEPOLIA_CCIP_ROUTER) {
      throw new Error("SEPOLIA_CCIP_ROUTER not set in environment");
    }
    if (!SEPOLIA_NFT_CONTRACT) {
      throw new Error("NEXT_PUBLIC_SEPOLIA_NFT_CONTRACT not set in environment");
    }

    console.log("========================================");
    console.log("DEPLOYING TO SEPOLIA");
    console.log("========================================\n");

    // 1. NFTOwnershipVerifier 배포
    console.log("📝 Deploying NFTOwnershipVerifier...");
    console.log(`   Router: ${SEPOLIA_CCIP_ROUTER}`);

    const Verifier = await ethers.getContractFactory("NFTOwnershipVerifier");
    const verifier = await Verifier.deploy(SEPOLIA_CCIP_ROUTER);
    await verifier.waitForDeployment();

    const verifierAddress = await verifier.getAddress();
    console.log(`✅ NFTOwnershipVerifier deployed: ${verifierAddress}\n`);

    // 2. Sepolia NFT 컬렉션 등록
    console.log("📝 Adding supported NFT...");
    console.log(`   NFT Contract: ${SEPOLIA_NFT_CONTRACT}`);

    const addNFTTx = await verifier.addSupportedNFT(SEPOLIA_NFT_CONTRACT);
    await addNFTTx.wait();
    console.log(`✅ NFT ${SEPOLIA_NFT_CONTRACT} added\n`);

    // 배포 정보 저장
    const deployment = {
      sepolia: {
        verifier: verifierAddress,
        ccipRouter: SEPOLIA_CCIP_ROUTER,
        supportedNFT: SEPOLIA_NFT_CONTRACT,
        chainSelector: SEPOLIA_CHAIN_SELECTOR || "16015286601757825753"
      },
      timestamp: new Date().toISOString(),
      network: "sepolia"
    };

    saveDeployment(deployment, "sepolia");

    console.log("📄 Deployment info saved to deployments/ccip-sepolia.json");
    console.log("\n✨ Sepolia Deployment Complete!\n");

    console.log("📋 Next Steps:");
    console.log("1. Update .env with:");
    console.log(`   NEXT_PUBLIC_SEPOLIA_VERIFIER_ADDRESS=${verifierAddress}`);
    console.log("2. Deploy MonadCCIPReceiver to Monad Testnet");
    console.log("3. Run: npx hardhat run scripts/deploy-ccip.js --network monad\n");
  }

  // Monad에 배포하는 경우
  else if (networkName === "monad" || network.chainId === BigInt(10143)) {
    if (!MONAD_CCIP_ROUTER) {
      throw new Error("MONAD_CCIP_ROUTER not set in environment");
    }
    if (!MINECRAFT_PFP_ADDRESS) {
      throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in environment");
    }

    console.log("========================================");
    console.log("DEPLOYING TO MONAD TESTNET");
    console.log("========================================\n");

    // 1. MonadCCIPReceiver 배포
    console.log("📝 Deploying MonadCCIPReceiver...");
    console.log(`   Router: ${MONAD_CCIP_ROUTER}`);

    const Receiver = await ethers.getContractFactory("MonadCCIPReceiver");
    const receiver = await Receiver.deploy(MONAD_CCIP_ROUTER);
    await receiver.waitForDeployment();

    const receiverAddress = await receiver.getAddress();
    console.log(`✅ MonadCCIPReceiver deployed: ${receiverAddress}\n`);

    // 2. MinecraftPFP 연결
    console.log("🔗 Setting MinecraftPFP contract...");
    console.log(`   MinecraftPFP: ${MINECRAFT_PFP_ADDRESS}`);

    const setPFPTx = await receiver.setMinecraftPFP(MINECRAFT_PFP_ADDRESS);
    await setPFPTx.wait();
    console.log(`✅ MinecraftPFP set\n`);

    // 3. Verifier 화이트리스트 설정 (Sepolia 배포 정보 필요)
    const sepoliaDeployment = loadDeployment("sepolia");

    if (sepoliaDeployment && sepoliaDeployment.sepolia) {
      console.log("🔐 Setting up trusted verifier...");
      console.log(`   Source Chain: Sepolia (${sepoliaDeployment.sepolia.chainSelector})`);
      console.log(`   Verifier: ${sepoliaDeployment.sepolia.verifier}`);

      const setVerifierTx = await receiver.setTrustedVerifier(
        sepoliaDeployment.sepolia.chainSelector,
        sepoliaDeployment.sepolia.verifier,
        true
      );
      await setVerifierTx.wait();
      console.log(`✅ Trusted verifier set\n`);
    } else {
      console.log("⚠️  Sepolia deployment info not found. Skipping verifier setup.");
      console.log("   You need to manually call setTrustedVerifier() later.\n");
    }

    // 4. MinecraftPFP에 CCIPReceiver 연결
    console.log("🔗 Connecting CCIPReceiver to MinecraftPFP...");

    const MinecraftPFP = await ethers.getContractAt(
      "MinecraftPFPWithWealth",
      MINECRAFT_PFP_ADDRESS
    );

    const setCCIPTx = await MinecraftPFP.setCCIPReceiver(receiverAddress);
    await setCCIPTx.wait();
    console.log(`✅ CCIPReceiver connected\n`);

    // 배포 정보 저장
    const deployment = {
      monad: {
        receiver: receiverAddress,
        ccipRouter: MONAD_CCIP_ROUTER,
        minecraftPFP: MINECRAFT_PFP_ADDRESS,
        chainSelector: MONAD_CHAIN_SELECTOR || "2183018362218727504"
      },
      timestamp: new Date().toISOString(),
      network: "monad"
    };

    saveDeployment(deployment, "monad");

    console.log("📄 Deployment info saved to deployments/ccip-monad.json");
    console.log("\n✨ Monad Deployment Complete!\n");

    console.log("📋 Next Steps:");
    console.log("1. Update .env with:");
    console.log(`   NEXT_PUBLIC_MONAD_CCIP_RECEIVER_ADDRESS=${receiverAddress}`);
    console.log("2. Test the full CCIP flow:");
    console.log("   - Create attestation on Sepolia");
    console.log("   - Bridge attestation to Monad");
    console.log("   - Mint NFT on Monad with CCIP bonus\n");
  } else {
    throw new Error(`Unsupported network: ${networkName}`);
  }
}

/**
 * 배포 정보 저장
 */
function saveDeployment(deployment, network) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  // deployments 디렉토리가 없으면 생성
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `ccip-${network}.json`);
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
}

/**
 * 배포 정보 로드
 */
function loadDeployment(network) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const filename = path.join(deploymentsDir, `ccip-${network}.json`);

  if (!fs.existsSync(filename)) {
    return null;
  }

  const content = fs.readFileSync(filename, "utf-8");
  return JSON.parse(content);
}

// 스크립트 실행
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

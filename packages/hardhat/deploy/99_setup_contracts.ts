import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const setupContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  // Get all deployed contracts
  const gameManager = await hre.ethers.getContract<Contract>("GameManager", deployer);
  const minerNFT = await hre.ethers.getContract<Contract>("MinerNFT", deployer);
  const rewardManager = await hre.ethers.getContract<Contract>("RewardManager", deployer);
  const miningEngine = await hre.ethers.getContract<Contract>("MiningEngine", deployer);
  const mmToken = await hre.ethers.getContract<Contract>("MMToken", deployer);

  console.log("\n=== 🎮 Monaminer 컨트랙트 배포 완료 ===");
  console.log("🎯 GameManager:", await gameManager.getAddress());
  console.log("⛏️ MinerNFT:", await minerNFT.getAddress());
  console.log("🎁 RewardManager:", await rewardManager.getAddress());
  console.log("⚒️ MiningEngine:", await miningEngine.getAddress());
  console.log("💰 MMToken:", await mmToken.getAddress());

  // 권한 설정 및 초기화
  console.log("\n=== 권한 설정 시작 ===");

  try {
    // 1. RewardManager에 MiningEngine이 보상을 분배할 수 있도록 권한 부여
    console.log("🔗 MiningEngine에 RewardManager 권한 부여...");
    const tx1 = await rewardManager.setMiningEngine(await miningEngine.getAddress());
    await tx1.wait();
    console.log("✅ MiningEngine 보상 분배 권한 설정 완료");

    // 2. MinerNFT에 GameManager가 NFT를 민팅할 수 있도록 권한 부여
    console.log("🔗 GameManager에 MinerNFT 민팅 권한 부여...");
    const tx2 = await minerNFT.setMinter(await gameManager.getAddress(), true);
    await tx2.wait();
    console.log("✅ GameManager NFT 민팅 권한 설정 완료");

    // 3. RewardManager에 보상용 MM 토큰 충전 (10,000 MM 토큰)
    console.log("🔗 RewardManager에 MM 토큰 충전 중...");
    const fundAmount = hre.ethers.parseEther("10000"); // 10,000 MM 토큰
    const tx3 = await mmToken.transfer(await rewardManager.getAddress(), fundAmount);
    await tx3.wait();
    console.log("✅ RewardManager에 10,000 MM 토큰 충전 완료");

    // 4. GameManager 초기화 (최초 NFT 민팅)
    console.log("🔗 GameManager 초기화 중...");
    const tx4 = await gameManager.initializeWithNFTs();
    await tx4.wait();
    console.log("✅ GameManager 초기화 완료 (최초 NFT 3개 민팅)");

    // 5. 현재 라운드 상태 확인
    console.log("🔍 현재 라운드 상태 확인...");
    const currentRound = await gameManager.getCurrentRound();
    console.log(
      `📊 현재 라운드: ${currentRound.roundId}, 패턴: ${currentRound.pattern}, 범위: ${currentRound.minRange}-${currentRound.maxRange}`,
    );

    // 6. RewardManager 잔액 확인
    const rewardBalance = await mmToken.balanceOf(await rewardManager.getAddress());
    console.log(`💰 RewardManager 잔액: ${hre.ethers.formatEther(rewardBalance)} MM`);
  } catch (error) {
    console.log("⚠️ 권한 설정 중 오류 발생:", error);
  }

  console.log("\n=== 🚀 모든 컨트랙트 배포 및 설정 완료! ===");
  console.log("디버깅을 위해 다음 주소들을 사용하세요:");
  console.log(`GameManager: ${await gameManager.getAddress()}`);
  console.log(`MinerNFT: ${await minerNFT.getAddress()}`);
  console.log(`RewardManager: ${await rewardManager.getAddress()}`);
  console.log(`MiningEngine: ${await miningEngine.getAddress()}`);
  console.log(`MMToken: ${await mmToken.getAddress()}`);

  console.log("\n=== 🎯 게임 시작 준비 완료! ===");
  console.log("🎮 플레이어는 이제 채굴을 시작할 수 있습니다!");
  console.log("⛏️ attemptMining(nftId) 함수를 사용하여 채굴 시도");
  console.log("🏆 1000회 성공 시 500 MM 완주 보너스 획득");
};

export default setupContracts;

setupContracts.tags = ["Setup"];
setupContracts.dependencies = ["GameManager", "MinerNFT", "RewardManager", "MiningEngine"];
setupContracts.runAtTheEnd = true;

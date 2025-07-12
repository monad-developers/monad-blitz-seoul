import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployRewardManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get previously deployed MM token
  const mmToken = await get("MMToken");

  // 개발팀 지갑 주소 (수수료를 받을 주소)
  const DEV_WALLET_ADDRESS = deployer; // 배포자 주소를 개발팀 지갑으로 사용

  await deploy("RewardManager", {
    from: deployer,
    args: [mmToken.address, DEV_WALLET_ADDRESS],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const rewardManager = await hre.ethers.getContract<Contract>("RewardManager", deployer);
  console.log("🎁 RewardManager deployed to:", await rewardManager.getAddress());
  console.log("📄 MM Token Address:", mmToken.address);
  console.log("👨‍💻 Dev Wallet Address:", DEV_WALLET_ADDRESS);
};

export default deployRewardManager;

deployRewardManager.tags = ["RewardManager"];
deployRewardManager.dependencies = ["MMToken"];

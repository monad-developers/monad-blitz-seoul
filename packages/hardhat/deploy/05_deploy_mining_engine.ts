import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMiningEngine: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get previously deployed contracts
  const gameManager = await get("GameManager");
  const minerNFT = await get("MinerNFT");
  const rewardManager = await get("RewardManager");

  await deploy("MiningEngine", {
    from: deployer,
    args: [gameManager.address, minerNFT.address, rewardManager.address],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const miningEngine = await hre.ethers.getContract<Contract>("MiningEngine", deployer);
  console.log("⚒️ MiningEngine deployed to:", await miningEngine.getAddress());
};

export default deployMiningEngine;

deployMiningEngine.tags = ["MiningEngine"];
deployMiningEngine.dependencies = ["GameManager", "MinerNFT", "RewardManager"];

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployGameManager: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get previously deployed contracts
  const minerNFT = await get("MinerNFT");

  // GameManager 배포 (라운드 관리 전담)
  await deploy("GameManager", {
    from: deployer,
    args: [minerNFT.address],
    log: true,
    autoMine: true,
    gasLimit: 15000000, // 가스 한도 명시적 설정
  });

  // Get the deployed contract to interact with it after deploying.
  const gameManager = await hre.ethers.getContract<Contract>("GameManager", deployer);
  console.log("🎮 GameManager deployed to:", await gameManager.getAddress());
  console.log("⛏️ MinerNFT Address:", minerNFT.address);
};

export default deployGameManager;

deployGameManager.tags = ["GameManager"];
deployGameManager.dependencies = ["MinerNFT"];

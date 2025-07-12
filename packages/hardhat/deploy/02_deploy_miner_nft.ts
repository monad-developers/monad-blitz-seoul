import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMinerNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("MinerNFT", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const minerNFT = await hre.ethers.getContract<Contract>("MinerNFT", deployer);
  console.log("⛏️ MinerNFT deployed to:", await minerNFT.getAddress());
};

export default deployMinerNFT;

deployMinerNFT.tags = ["MinerNFT"];
// MinerNFT는 다른 컨트랙트에 의존하지 않음

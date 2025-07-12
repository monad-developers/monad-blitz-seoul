import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployMMToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("MMToken", {
    from: deployer,
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const mmToken = await hre.ethers.getContract<Contract>("MMToken", deployer);
  console.log("💰 MMToken deployed to:", await mmToken.getAddress());

  // Check initial balance
  const balance = await mmToken.balanceOf(deployer);
  console.log("💳 Deployer MM balance:", hre.ethers.formatEther(balance), "MM");
};

export default deployMMToken;

deployMMToken.tags = ["MMToken"];

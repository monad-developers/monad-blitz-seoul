import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "ProfileNFT" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProfileNFT: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("ProfileNFT", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const profileNFT = await hre.ethers.getContract<Contract>("ProfileNFT", deployer);
  console.log("🚀 ProfileNFT deployed!");
  console.log("📋 Contract address:", await profileNFT.getAddress());
  console.log("💰 Current mint fee:", await profileNFT.mintFee());
};

export default deployProfileNFT;

deployProfileNFT.tags = ["ProfileNFT"];

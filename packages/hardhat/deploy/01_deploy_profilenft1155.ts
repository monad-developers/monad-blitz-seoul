import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "ProfileNFT1155" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployProfileNFT1155: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("ProfileNFT1155", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const profileNFT1155 = await hre.ethers.getContract<Contract>("ProfileNFT1155", deployer);
  console.log("🚀 ProfileNFT1155 (ERC1155) deployed!");
  console.log("📋 Contract address:", await profileNFT1155.getAddress());
  console.log("💰 Current mint fee:", await profileNFT1155.mintFee());
};

export default deployProfileNFT1155;

deployProfileNFT1155.tags = ["ProfileNFT1155"];
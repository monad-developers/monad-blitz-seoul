import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "USDxToken" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployUSDxToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying USDxToken with the account:", deployer);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer)).toString());

  await deploy("USDxToken", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const usdxToken = await hre.ethers.getContract("USDxToken", deployer);
  console.log("USDxToken deployed to:", await usdxToken.getAddress());

  // Set USDx token address in TokenMinter contract
  const tokenMinter = await hre.ethers.getContract("TokenMinter", deployer);
  await tokenMinter.setUsdxToken(await usdxToken.getAddress());
  console.log("USDx token address set in TokenMinter");

  // Transfer USDx token ownership to TokenMinter contract
  await usdxToken.transferOwnership(await tokenMinter.getAddress());
  console.log("USDx token ownership transferred to TokenMinter");
};

export default deployUSDxToken;

deployUSDxToken.tags = ["USDxToken"]; 
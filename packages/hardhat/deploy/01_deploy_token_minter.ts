import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys a contract named "TokenMinter" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployTokenMinter: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    can be configured by specifying the private key in the config file (see `hardhat.config.ts`)
    or by setting the PRIVATE_KEY environment variable.

    You can also use a different account by setting the `ACCOUNT_PRIVATE_KEY` environment variable.
   */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying TokenMinter with the account:", deployer);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer)).toString());

  await deploy("TokenMinter", {
    from: deployer,
    // Contract constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract
  const tokenMinter = await hre.ethers.getContract("TokenMinter", deployer);
  console.log("TokenMinter deployed to:", await tokenMinter.getAddress());
};

export default deployTokenMinter;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags TokenMinter
deployTokenMinter.tags = ["TokenMinter"]; 
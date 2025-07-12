import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // MockERC20 deploy
  const mockETH = await deploy("MockERC20", {
    from: deployer,
    args: ["Mock Ethereum", "ETH", "0x3710a38d7310F0036a6094cC8b9aBae95Fcf2B20"],
    log: true,
    autoMine: true,
  });
  const mockLINK = await deploy("MockERC20", {
    from: deployer,
    args: ["Mock Link", "LINK", "0xa7E6a5baA467E212f6c0B996828839902Da32ec9"],
    log: true,
    autoMine: true,
  });
  console.log("mock erc20 : ", mockETH.address, mockLINK.address);

  // InstantSwap deploy
  await deploy("InstantSwap", {
    from: deployer,
    args: [], // TODO
    log: true,
    autoMine: true,
  });

  const yourContract = await hre.ethers.getContract<Contract>("InstantSwap", deployer);
  console.log("instant swap : ", await yourContract.getAddress());
};

export default deployYourContract;

deployYourContract.tags = ["InstantSwap"];

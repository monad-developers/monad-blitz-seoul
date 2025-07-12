import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with:", deployer.address);

  const Game = await ethers.getContractFactory("MonadClickerGame");
  const game = await Game.deploy(deployer.address);

  await game.waitForDeployment();

  const deployedAddress = await game.getAddress();
  console.log("Contract deployed to:", deployedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 
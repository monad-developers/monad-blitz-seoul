import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("=".repeat(50));
  console.log("Deploying OXGame to Monad Testnet...");
  console.log("=".repeat(50));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");

  // Oracle address (deployer acts as oracle)
  const oracleAddress = deployer.address;
  console.log("Oracle:", oracleAddress);

  console.log("\nDeploying OXGame contract...");
  const OXGame = await ethers.getContractFactory("OXGame");
  const oxGame = await OXGame.deploy(oracleAddress);
  await oxGame.waitForDeployment();

  const oxGameAddress = await oxGame.getAddress();
  console.log("OXGame deployed to:", oxGameAddress);

  // Verify deployment
  const depositAmount = await oxGame.DEPOSIT_AMOUNT();
  const maxPlayers = await oxGame.MAX_PLAYERS();
  const roundDuration = await oxGame.ROUND_DURATION();

  console.log("\n=== Contract Info ===");
  console.log("Deposit:", ethers.formatEther(depositAmount), "MON");
  console.log("Max Players:", maxPlayers.toString());
  console.log("Round Duration:", roundDuration.toString(), "seconds");

  // Check pool status
  console.log("\n=== Pool Status ===");
  const chainTypes = ["ETH", "LINK", "BTC"];
  for (let i = 0; i < 3; i++) {
    const poolInfo = await oxGame.getPoolInfo(i);
    console.log(`${chainTypes[i]} Pool - Active:`, poolInfo[3]);
  }

  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      OXGame: oxGameAddress,
      Oracle: oracleAddress
    }
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

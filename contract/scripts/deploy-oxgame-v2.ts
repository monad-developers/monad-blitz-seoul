import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("=".repeat(60));
  console.log("Deploying OXGameV2 (5-second intervals) to Monad Testnet");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("\nDeployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");

  if (balance === 0n) {
    console.error("\n❌ Error: Insufficient MON balance!");
    process.exit(1);
  }

  // Oracle address (deployer acts as oracle)
  const oracleAddress = deployer.address;
  console.log("Oracle:", oracleAddress);

  console.log("\n" + "=".repeat(60));
  console.log("Deploying OXGameV2...");
  console.log("=".repeat(60));

  const OXGameV2 = await ethers.getContractFactory("OXGameV2");
  const oxGameV2 = await OXGameV2.deploy(oracleAddress);
  await oxGameV2.waitForDeployment();

  const contractAddress = await oxGameV2.getAddress();
  console.log("\n✅ OXGameV2 deployed!");
  console.log("Contract Address:", contractAddress);

  // Verify deployment
  const depositAmount = await oxGameV2.DEPOSIT_AMOUNT();
  const maxPlayers = await oxGameV2.MAX_PLAYERS();
  const roundDuration = await oxGameV2.ROUND_DURATION();

  console.log("\n" + "=".repeat(60));
  console.log("Contract Configuration");
  console.log("=".repeat(60));
  console.log("Entry Fee:", ethers.formatEther(depositAmount), "MON");
  console.log("Max Players:", maxPlayers.toString());
  console.log("Round Duration:", roundDuration.toString(), "seconds");
  console.log("Oracle:", await oxGameV2.oracle());

  // Check pool status
  console.log("\n" + "=".repeat(60));
  console.log("Pool Status");
  console.log("=".repeat(60));

  const chainTypes = [
    { name: "ETH", id: 0 },
    { name: "LINK", id: 1 },
    { name: "BTC", id: 2 }
  ];

  for (const chain of chainTypes) {
    const poolInfo = await oxGameV2.getPoolInfo(chain.id);
    console.log(`\n${chain.name} Pool:`);
    console.log("  Total Deposit:", ethers.formatEther(poolInfo[0]), "MON");
    console.log("  Current Round:", poolInfo[1].toString());
    console.log("  Active:", poolInfo[3] ? "✅" : "❌");
    console.log("  Active Players:", poolInfo[4].toString());
    console.log("  Total Players:", poolInfo[5].toString());
  }

  // Deployment summary
  const deploymentInfo = {
    network: "monad-testnet",
    chainId: 10143,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      OXGameV2: contractAddress,
      Oracle: oracleAddress
    },
    configuration: {
      depositAmount: ethers.formatEther(depositAmount),
      maxPlayers: maxPlayers.toString(),
      roundDuration: roundDuration.toString()
    }
  };

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary (JSON)");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("Next Steps");
  console.log("=".repeat(60));
  console.log("1. Verify contract:");
  console.log(`   npm run verify:v2 ${contractAddress} ${oracleAddress}`);
  console.log("\n2. View on explorer:");
  console.log(`   https://testnet.monadexplorer.com/address/${contractAddress}`);
  console.log("\n3. Backend configuration:");
  console.log(`   OXGAME_V2_ADDRESS=${contractAddress}`);
  console.log(`   ORACLE_PRIVATE_KEY=${process.env.PRIVATE_KEY}`);
  console.log("\n4. Start 5-second oracle scheduler in backend");

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

import "dotenv/config";
import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const {
    OPERATOR,
    WINNERS_COUNT
  } = process.env;

  console.log("Deploying with:", deployer.address);

  const Raffle = await hre.ethers.getContractFactory("SponsoredRaffle");
  const raffle = await Raffle.deploy(
    deployer.address,
    OPERATOR,
    Number(WINNERS_COUNT || 3)
  );
  await raffle.waitForDeployment();

  console.log("SponsoredRaffle deployed:", await raffle.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });

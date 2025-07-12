import { ethers } from "hardhat";

async function main() {
  const eoaAddress = process.env.EOA_ADDRESS ?? "";
  const provider = ethers.provider;

  const balance = await provider.getBalance(eoaAddress);
  console.log("ETH Balance:", ethers.formatEther(balance), "ETH");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
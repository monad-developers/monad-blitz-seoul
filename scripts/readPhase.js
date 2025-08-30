// scripts/readPhase.js
import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const {
  RPC_URL,
  CONTRACT_ADDRESS
} = process.env;

const abi = JSON.parse(
  fs.readFileSync(new URL("../artifacts/contracts/SponsoredRaffle.sol/SponsoredRaffle.json", import.meta.url))
).abi;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
  const phase = await contract.phase();
  const phaseNames = ["Enter", "Locked", "Requested", "Drawn"];
  console.log("Current phase:", phase, phaseNames[Number(phase)] || "?");
}

main().catch(console.error);

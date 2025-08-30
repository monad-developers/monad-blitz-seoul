import { config } from "dotenv";
import { execSync } from "child_process";

// Load environment variables
config();

const network = process.argv[2] || "local";
let rpcUrl;

if (network === "monad") {
  rpcUrl = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz";
  console.log("Checking balance on Monad testnet...");
} else {
  rpcUrl = process.env.LOCAL_RPC_URL || "http://localhost:8545";
  console.log("Checking balance on local network...");
}

const command = `forge script script/CheckBalance.s.sol --rpc-url ${rpcUrl}`;

console.log(`RPC URL: ${rpcUrl}`);
console.log("");

try {
  execSync(command, { stdio: "inherit", cwd: process.cwd() });
} catch (error) {
  console.error("Balance check failed:", error.message);
  process.exit(1);
}
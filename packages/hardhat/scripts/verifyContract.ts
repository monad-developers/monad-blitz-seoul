import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

async function main() {
  try {
    // Get the deployments directory path
    const deploymentsPath = path.join(__dirname, "../deployments/monadTestnet");

    // Read all files in the deployments directory
    const files = fs.readdirSync(deploymentsPath);

    // Filter for .json files and get the latest one by modification time
    const jsonFiles = files
      .filter(file => file.endsWith(".json"))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(deploymentsPath, file)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (jsonFiles.length === 0) {
      throw new Error("No deployment files found");
    }

    // Read the latest deployment file
    const latestDeployment = JSON.parse(fs.readFileSync(path.join(deploymentsPath, jsonFiles[0].name), "utf8"));

    const contractAddress = latestDeployment.address;
    const constructorArgs = latestDeployment.args;

    console.log(`Latest deployed contract address: ${contractAddress}`);
    console.log(`Contract name: ${jsonFiles[0].name.replace(".json", "")}`);
    console.log(`Constructor arguments: ${constructorArgs.join(", ")}`);

    // Run the verify command with constructor arguments
    console.log("Starting verification...");
    const { stdout, stderr } = await execPromise(
      `yarn hardhat verify --network monadTestnet ${contractAddress} ${constructorArgs.join(" ")}`,
    );

    console.log("Verification output:");
    console.log(stdout);

    if (stderr) {
      console.error("Verification errors:");
      console.error(stderr);
    }
  } catch (error) {
    console.error("Error during verification:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

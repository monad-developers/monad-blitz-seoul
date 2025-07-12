const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  try {
    // Read deployment info
    const deploymentInfo = JSON.parse(
      fs.readFileSync("deployment.json", "utf8")
    );
    const contractAddress = deploymentInfo.contractAddress;

    console.log("Connecting to DataStorage contract at:", contractAddress);

    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);

    // Connect to the deployed contract
    const DataStorage = await ethers.getContractFactory("DataStorage");
    const dataStorage = DataStorage.attach(contractAddress);

    // Get current gas settings
    const provider = signer.provider;
    const feeData = await provider.getFeeData();

    console.log("Current gas prices:");
    console.log(
      "- Gas Price:",
      feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A",
      "gwei"
    );
    console.log(
      "- Max Fee Per Gas:",
      feeData.maxFeePerGas
        ? ethers.formatUnits(feeData.maxFeePerGas, "gwei")
        : "N/A",
      "gwei"
    );

    // Prepare gas settings for transactions
    const gasOptions = {};

    // For EIP-1559 networks
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      gasOptions.maxFeePerGas = feeData.maxFeePerGas * 2n; // Double the suggested fee
      gasOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * 2n;
    }
    // For legacy networks
    else if (feeData.gasPrice) {
      gasOptions.gasPrice = feeData.gasPrice * 2n; // Double the gas price
    }

    gasOptions.gasLimit = 500000; // Set reasonable gas limit for transactions

    console.log("\n=== Inserting Sample Data ===");

    // Store string data
    console.log("Storing string data...");
    let tx = await dataStorage.storeString(
      "userName",
      "Alice Johnson",
      gasOptions
    );
    await tx.wait();
    console.log("✓ Stored: userName = 'Alice Johnson'");

    console.log("\n=== Retrieving Data ===");

    // Retrieve and display all data
    const userName = await dataStorage.getString("userName");
    const userEmail = await dataStorage.getString("userEmail");
    const company = await dataStorage.getString("company");

    const userAge = await dataStorage.getNumber("userAge");
    const salary = await dataStorage.getNumber("salary");
    const employeeId = await dataStorage.getNumber("employeeId");

    const isActive = await dataStorage.getBool("isActive");
    const isManager = await dataStorage.getBool("isManager");
    const hasAccess = await dataStorage.getBool("hasAccess");

    const stringKeys = await dataStorage.getStringKeys();
    const numberKeys = await dataStorage.getNumberKeys();
    const boolKeys = await dataStorage.getBoolKeys();

    console.log("String Keys:", stringKeys);
    console.log("Number Keys:", numberKeys);
    console.log("Boolean Keys:", boolKeys);

    // Get total count
    const totalCount = await dataStorage.getTotalItemCount();
    console.log("\nTotal Items Stored:", totalCount.toString());

    console.log("\n✅ All operations completed successfully!");
  } catch (error) {
    console.error("Error:", error);

    // If it's a gas-related error, provide helpful advice
    if (
      error.message.includes("maxFeePerGas") ||
      error.message.includes("gasPrice")
    ) {
      console.log("\n💡 Gas-related error detected. Try the following:");
      console.log("1. Wait a few minutes for network congestion to decrease");
      console.log("2. Increase gas settings in hardhat.config.js");
      console.log("3. Use a different network (localhost for testing)");
      console.log("4. Check if you have enough ETH for gas fees");
    }

    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

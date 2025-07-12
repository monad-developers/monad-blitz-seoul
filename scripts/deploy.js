const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DataStorage contract...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get current gas price and adjust
  const provider = deployer.provider;
  const feeData = await provider.getFeeData();

  console.log("Current network fee data:");
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
  console.log(
    "- Max Priority Fee:",
    feeData.maxPriorityFeePerGas
      ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")
      : "N/A",
    "gwei"
  );

  // Deploy the contract with explicit gas settings
  const DataStorage = await ethers.getContractFactory("DataStorage");

  // Prepare deployment options
  const deployOptions = {};

  // For EIP-1559 networks (mainnet, sepolia)
  if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
    deployOptions.maxFeePerGas = feeData.maxFeePerGas * 2n; // Double the suggested fee
    deployOptions.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas * 2n;
  }
  // For legacy networks
  else if (feeData.gasPrice) {
    deployOptions.gasPrice = feeData.gasPrice * 2n; // Double the gas price
  }

  deployOptions.gasLimit = 3000000; // Set a reasonable gas limit

  console.log("Deploying with gas settings:", deployOptions);

  const dataStorage = await DataStorage.deploy(deployOptions);

  console.log("Waiting for deployment...");
  await dataStorage.waitForDeployment();
  const contractAddress = await dataStorage.getAddress();

  console.log("DataStorage deployed to:", contractAddress);

  // Get deployment transaction
  const deployTx = dataStorage.deploymentTransaction();
  console.log("Deployment transaction hash:", deployTx.hash);
  console.log("Gas used:", deployTx.gasLimit.toString());

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: hre.network.name,
    deploymentTime: new Date().toISOString(),
    transactionHash: deployTx.hash,
    gasUsed: deployTx.gasLimit.toString(),
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to deployment.json");

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

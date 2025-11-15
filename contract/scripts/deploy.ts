import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts to Monad testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MON");

  // Deploy SimpleStorage
  console.log("\n=== Deploying SimpleStorage ===");
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy(42);
  await simpleStorage.waitForDeployment();
  const simpleStorageAddress = await simpleStorage.getAddress();
  console.log("SimpleStorage deployed to:", simpleStorageAddress);

  // Verify deployment
  const storedValue = await simpleStorage.retrieve();
  console.log("Initial stored value:", storedValue.toString());

  // Deploy PriceConsumer (ETH/USD)
  console.log("\n=== Deploying PriceConsumer (ETH/USD) ===");
  const ETH_USD_FEED = process.env.ETH_USD_FEED || "0x0c76859E85727683Eeba0C70Bc2e0F5781337818";
  const PriceConsumer = await ethers.getContractFactory("PriceConsumer");
  const priceConsumer = await PriceConsumer.deploy(ETH_USD_FEED, "ETH / USD");
  await priceConsumer.waitForDeployment();
  const priceConsumerAddress = await priceConsumer.getAddress();
  console.log("PriceConsumer deployed to:", priceConsumerAddress);

  // Get latest price
  try {
    const price = await priceConsumer.getLatestPrice();
    const decimals = await priceConsumer.getDecimals();
    console.log("Latest ETH/USD Price:", Number(price) / 10 ** Number(decimals));
  } catch (error) {
    console.log("Could not fetch price (might need time to sync with oracle)");
  }

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network: Monad Testnet (Chain ID: 10143)");
  console.log("Deployer:", deployer.address);
  console.log("SimpleStorage:", simpleStorageAddress);
  console.log("PriceConsumer:", priceConsumerAddress);
  console.log("\nSave these addresses for frontend integration!");

  // Export addresses
  const addresses = {
    network: "monad-testnet",
    chainId: 10143,
    deployer: deployer.address,
    contracts: {
      SimpleStorage: simpleStorageAddress,
      PriceConsumer: priceConsumerAddress,
    },
  };

  console.log("\n=== Contract Addresses (JSON) ===");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

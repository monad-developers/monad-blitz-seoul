const { ethers } = require("hardhat");
const fs = require("fs");

async function main(value) {
  try {
    // Read deployment info
    //const deploymentInfo = JSON.parse(
    //fs.readFileSync("deployment.json", "utf8")
    //);
    const contractAddress = "0x789b17D17a2a16542a4938fc063bae2ccee1FfE7"; //deploymentInfo.contractAddress;

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
      "weather",
      value.toString(),
      gasOptions
    );
    await tx.wait();
    console.log("✓ Stored: weather = ", value.toString());

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

setInterval(() => {
  try {
    const currentTime = new Date();
    // convert time to utc + 09
    currentTime.setHours(currentTime.getHours() + 9); // Adjust for UTC+9
    const HHMM = currentTime.toISOString().slice(11, 16).replace(":", "");
    fetch(
      `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=zZJfid0qBw7OZkAjneeU1K9SRYd9klZm8ApusAZkqKWVOyRiXv6JsMsV4PmS7%2BuZokebtYY1dIyjbzG2nlMubQ%3D%3D&pageNo=1&numOfRows=1000&dataType=JSON&base_date=20250712&base_time=0601&nx=55&ny=127`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        weather = data.response.body.items.item[0].obsrValue;
        console.log(HHMM, data.response.body.items.item[0].obsrValue);
        main(weather)
          .then(() => console.log("Data inserted successfully\n\n"))
          .catch((error) => {
            console.error(error);
            process.exit(1);
          });
      });
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}, 5000);

const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Server is running");
});

server.listen(3040, () => {
  console.log("Server running on port 3040");
});

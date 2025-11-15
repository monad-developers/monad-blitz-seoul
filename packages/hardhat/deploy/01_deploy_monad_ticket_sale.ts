import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys MonadTicketSale contract for NFT-based ticketing system
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMonadTicketSale: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🎫 Deploying MonadTicketSale contract...");
  console.log("Deployer address:", deployer);

  await deploy("MonadTicketSale", {
    from: deployer,
    args: [], // No constructor arguments
    log: true,
    autoMine: true,
  });

  // Get the deployed contract
  const monadTicketSale = await hre.ethers.getContract<Contract>("MonadTicketSale", deployer);
  const contractAddress = await monadTicketSale.getAddress();

  console.log("✅ MonadTicketSale deployed to:", contractAddress);
  console.log("🎟️  NFT Name:", await monadTicketSale.name());
  console.log("🎟️  NFT Symbol:", await monadTicketSale.symbol());
  console.log("\n📅 Creating sample events...\n");

  // Helper function to get future date
  const getFutureDate = (daysFromNow: number) => {
    return Math.floor(Date.now() / 1000) + 86400 * daysFromNow;
  };

  // Event 1: BTS Concert (Large event with 3 tiers - 200 seats)
  // Price: VIP (1.5 ETH) > Standard (0.8 ETH) > Economy (0.3 ETH)
  // Seats: VIP (30) < Standard (70) < Economy (100)
  try {
    const vipSeats = Array.from({ length: 30 }, (_, i) => `VIP-A${String(i + 1).padStart(3, "0")}`);
    const standardSeats = Array.from({ length: 70 }, (_, i) => `STD-B${String(i + 1).padStart(3, "0")}`);
    const economySeats = Array.from({ length: 100 }, (_, i) => `ECO-C${String(i + 1).padStart(3, "0")}`);

    const tx1 = await monadTicketSale.createEvent(
      "BTS World Tour - Seoul",
      getFutureDate(30),
      ["VIP", "Standard", "Economy"],
      [hre.ethers.parseEther("1.5"), hre.ethers.parseEther("0.8"), hre.ethers.parseEther("0.3")],
      [30, 70, 100],
      [vipSeats, standardSeats, economySeats],
    );
    await tx1.wait();
    console.log("✅ Event 1: BTS World Tour - Seoul (200 seats: VIP 30, Standard 70, Economy 100)");
  } catch (error) {
    console.log("⚠️  Event 1 creation failed:", error);
  }

  // Event 2: IU Concert (Medium event with 2 tiers - 180 seats)
  // Price: Premium (1.2 ETH) > General (0.6 ETH)
  // Seats: Premium (60) < General (120)
  try {
    const premiumSeats = Array.from({ length: 60 }, (_, i) => `PRE-A${String(i + 1).padStart(3, "0")}`);
    const generalSeats = Array.from({ length: 120 }, (_, i) => `GEN-B${String(i + 1).padStart(3, "0")}`);

    const tx2 = await monadTicketSale.createEvent(
      "IU Love Poem Concert",
      getFutureDate(45),
      ["Premium", "General"],
      [hre.ethers.parseEther("1.2"), hre.ethers.parseEther("0.6")],
      [60, 120],
      [premiumSeats, generalSeats],
    );
    await tx2.wait();
    console.log("✅ Event 2: IU Love Poem Concert (180 seats: Premium 60, General 120)");
  } catch (error) {
    console.log("⚠️  Event 2 creation failed:", error);
  }

  // Event 3: Rock Festival (Large festival with 4 tiers - 220 seats)
  // Price: Diamond (2.0) > Gold (1.0) > Silver (0.5) > Bronze (0.2)
  // Seats: Diamond (30) < Gold (50) < Silver (70) < Bronze (70)
  try {
    const diamondSeats = Array.from({ length: 30 }, (_, i) => `DIA-A${String(i + 1).padStart(3, "0")}`);
    const goldSeats = Array.from({ length: 50 }, (_, i) => `GLD-B${String(i + 1).padStart(3, "0")}`);
    const silverSeats = Array.from({ length: 70 }, (_, i) => `SLV-C${String(i + 1).padStart(3, "0")}`);
    const bronzeSeats = Array.from({ length: 70 }, (_, i) => `BRZ-D${String(i + 1).padStart(3, "0")}`);

    const tx3 = await monadTicketSale.createEvent(
      "Monad Rock Festival 2025",
      getFutureDate(60),
      ["Diamond", "Gold", "Silver", "Bronze"],
      [
        hre.ethers.parseEther("2.0"),
        hre.ethers.parseEther("1.0"),
        hre.ethers.parseEther("0.5"),
        hre.ethers.parseEther("0.2"),
      ],
      [30, 50, 70, 70],
      [diamondSeats, goldSeats, silverSeats, bronzeSeats],
    );
    await tx3.wait();
    console.log("✅ Event 3: Monad Rock Festival 2025 (220 seats: Diamond 30, Gold 50, Silver 70, Bronze 70)");
  } catch (error) {
    console.log("⚠️  Event 3 creation failed:", error);
  }

  // Event 4: Jazz Night (Medium event - 150 seats)
  // Price: Front Row (0.9 ETH) > Regular (0.4 ETH)
  // Seats: Front Row (50) < Regular (100)
  try {
    const frontRowSeats = Array.from({ length: 50 }, (_, i) => `FR-A${String(i + 1).padStart(3, "0")}`);
    const regularSeats = Array.from({ length: 100 }, (_, i) => `REG-B${String(i + 1).padStart(3, "0")}`);

    const tx4 = await monadTicketSale.createEvent(
      "Monad Jazz Night",
      getFutureDate(20),
      ["Front Row", "Regular"],
      [hre.ethers.parseEther("0.9"), hre.ethers.parseEther("0.4")],
      [50, 100],
      [frontRowSeats, regularSeats],
    );
    await tx4.wait();
    console.log("✅ Event 4: Monad Jazz Night (150 seats: Front Row 50, Regular 100)");
  } catch (error) {
    console.log("⚠️  Event 4 creation failed:", error);
  }

  // Event 5: Tech Conference (Single tier - 200 seats)
  // Price: All Access (0.5 ETH)
  // Seats: All Access (200) - Single tier event
  try {
    const allAccessSeats = Array.from({ length: 200 }, (_, i) => `CONF-${String(i + 1).padStart(3, "0")}`);

    const tx5 = await monadTicketSale.createEvent(
      "Monad Developer Conference 2025",
      getFutureDate(90),
      ["All Access"],
      [hre.ethers.parseEther("0.5")],
      [200],
      [allAccessSeats],
    );
    await tx5.wait();
    console.log("✅ Event 5: Monad Developer Conference 2025 (200 seats: All Access 200)");
  } catch (error) {
    console.log("⚠️  Event 5 creation failed:", error);
  }

  console.log("\n📊 Final Stats:");
  console.log("Total Events:", await monadTicketSale.getEventCount());

  const allEvents = await monadTicketSale.getAllEvents();
  let totalSeats = 0;
  for (const event of allEvents) {
    totalSeats += Number(event.totalTickets);
  }
  console.log("Total Seats Created:", totalSeats);
  console.log("\n🎉 Sample events created successfully!");
};

export default deployMonadTicketSale;

deployMonadTicketSale.tags = ["MonadTicketSale"];

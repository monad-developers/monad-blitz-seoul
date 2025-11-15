import { expect } from "chai";
import { ethers } from "hardhat";
import { MonadTicketSale } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MonadTicketSale", function () {
  let monadTicketSale: MonadTicketSale;
  let issuer: HardhatEthersSigner;
  let buyer1: HardhatEthersSigner;
  let buyer2: HardhatEthersSigner;

  before(async () => {
    const signers = await ethers.getSigners();
    issuer = signers[1];
    buyer1 = signers[2];
    buyer2 = signers[3];

    const monadTicketSaleFactory = await ethers.getContractFactory("MonadTicketSale");
    monadTicketSale = (await monadTicketSaleFactory.deploy()) as MonadTicketSale;
    await monadTicketSale.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct NFT name and symbol", async function () {
      expect(await monadTicketSale.name()).to.equal("MonadTicket");
      expect(await monadTicketSale.symbol()).to.equal("MTKT");
    });

    it("Should have zero events on deployment", async function () {
      expect(await monadTicketSale.getEventCount()).to.equal(0);
    });
  });

  describe("Event Creation", function () {
    it("Should create an event with multiple tiers", async function () {
      const eventName = "BTS Concert";
      const eventDate = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now

      const tierNames = ["VIP", "Standard"];
      const tierPrices = [ethers.parseEther("1.0"), ethers.parseEther("0.5")];
      const tierCounts = [2, 3];
      const tierSeatIds = [
        ["A-01", "A-02"],
        ["B-01", "B-02", "B-03"],
      ];

      const tx = await monadTicketSale
        .connect(issuer)
        .createEvent(eventName, eventDate, tierNames, tierPrices, tierCounts, tierSeatIds);

      await expect(tx).to.emit(monadTicketSale, "EventCreated").withArgs(1, issuer.address, eventName, eventDate, 5);

      expect(await monadTicketSale.getEventCount()).to.equal(1);
    });

    it("Should retrieve the created event", async function () {
      const events = await monadTicketSale.getAllEvents();
      expect(events.length).to.equal(1);
      expect(events[0].name).to.equal("BTS Concert");
      expect(events[0].issuer).to.equal(issuer.address);
      expect(events[0].totalTickets).to.equal(5);
      expect(events[0].soldTickets).to.equal(0);
    });

    it("Should retrieve event tiers", async function () {
      const tiers = await monadTicketSale.getEventTiers(1);
      expect(tiers.length).to.equal(2);

      expect(tiers[0].name).to.equal("VIP");
      expect(tiers[0].price).to.equal(ethers.parseEther("1.0"));
      expect(tiers[0].totalCount).to.equal(2);

      expect(tiers[1].name).to.equal("Standard");
      expect(tiers[1].price).to.equal(ethers.parseEther("0.5"));
      expect(tiers[1].totalCount).to.equal(3);
    });

    it("Should not allow creating event with past date", async function () {
      const pastDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago

      await expect(
        monadTicketSale
          .connect(issuer)
          .createEvent("Past Event", pastDate, ["VIP"], [ethers.parseEther("1.0")], [1], [["A-01"]]),
      ).to.be.revertedWith("Event date must be in the future");
    });
  });

  describe("Ticket Purchase", function () {
    it("Should allow buying a VIP ticket", async function () {
      const seatId = "A-01";
      const price = ethers.parseEther("1.0");

      const tx = await monadTicketSale.connect(buyer1).buyTicket(1, seatId, { value: price });

      await expect(tx).to.emit(monadTicketSale, "TicketPurchased").withArgs(1, 1, buyer1.address, seatId, price);

      // Check NFT ownership
      expect(await monadTicketSale.ownerOf(1)).to.equal(buyer1.address);
      expect(await monadTicketSale.balanceOf(buyer1.address)).to.equal(1);
    });

    it("Should allow buying a Standard ticket", async function () {
      const seatId = "B-01";
      const price = ethers.parseEther("0.5");

      await monadTicketSale.connect(buyer2).buyTicket(1, seatId, { value: price });

      expect(await monadTicketSale.ownerOf(3)).to.equal(buyer2.address);
    });

    it("Should reject purchase with incorrect payment", async function () {
      const seatId = "A-02";
      const wrongPrice = ethers.parseEther("0.5"); // VIP is 1.0 ETH

      await expect(monadTicketSale.connect(buyer1).buyTicket(1, seatId, { value: wrongPrice })).to.be.revertedWith(
        "Incorrect payment amount",
      );
    });

    it("Should reject purchase of already sold seat", async function () {
      const seatId = "A-01"; // Already sold
      const price = ethers.parseEther("1.0");

      await expect(monadTicketSale.connect(buyer2).buyTicket(1, seatId, { value: price })).to.be.revertedWith(
        "Seat already sold",
      );
    });

    it("Should reject purchase of non-existent seat", async function () {
      const seatId = "Z-99";
      const price = ethers.parseEther("1.0");

      await expect(monadTicketSale.connect(buyer1).buyTicket(1, seatId, { value: price })).to.be.revertedWith(
        "Seat does not exist",
      );
    });
  });

  describe("Seat Query Functions", function () {
    it("Should return all seats with status", async function () {
      const result = await monadTicketSale.getEventAllSeatsWithStatus(1);

      expect(result.seatIds.length).to.equal(5);
      expect(result.tokenIds.length).to.equal(5);
      expect(result.owners.length).to.equal(5);
      expect(result.availabilities.length).to.equal(5);
      expect(result.prices.length).to.equal(5);

      // Check A-01 (sold to buyer1)
      expect(result.seatIds[0]).to.equal("A-01");
      expect(result.owners[0]).to.equal(buyer1.address);
      expect(result.availabilities[0]).to.equal(false);
      expect(result.prices[0]).to.equal(ethers.parseEther("1.0"));

      // Check A-02 (available)
      expect(result.seatIds[1]).to.equal("A-02");
      expect(result.owners[1]).to.equal(ethers.ZeroAddress);
      expect(result.availabilities[1]).to.equal(true);
      expect(result.prices[1]).to.equal(ethers.parseEther("1.0"));

      // Check B-01 (sold to buyer2)
      expect(result.seatIds[2]).to.equal("B-01");
      expect(result.owners[2]).to.equal(buyer2.address);
      expect(result.availabilities[2]).to.equal(false);
      expect(result.prices[2]).to.equal(ethers.parseEther("0.5"));
    });

    it("Should check seat availability", async function () {
      expect(await monadTicketSale.isSeatAvailable(1, "A-01")).to.equal(false);
      expect(await monadTicketSale.isSeatAvailable(1, "A-02")).to.equal(true);
      expect(await monadTicketSale.isSeatAvailable(1, "B-01")).to.equal(false);
      expect(await monadTicketSale.isSeatAvailable(1, "B-02")).to.equal(true);
    });

    it("Should get seat info", async function () {
      const seatInfo = await monadTicketSale.getSeatInfo(1, "A-01");

      expect(seatInfo.seatId).to.equal("A-01");
      expect(seatInfo.eventId).to.equal(1);
      expect(seatInfo.owner).to.equal(buyer1.address);
      expect(seatInfo.isAvailable).to.equal(false);
      expect(seatInfo.price).to.equal(ethers.parseEther("1.0"));
    });

    it("Should get user tickets for an event", async function () {
      const buyer1Tickets = await monadTicketSale.getUserTickets(buyer1.address, 1);
      expect(buyer1Tickets.length).to.equal(1);
      expect(buyer1Tickets[0]).to.equal("A-01");

      const buyer2Tickets = await monadTicketSale.getUserTickets(buyer2.address, 1);
      expect(buyer2Tickets.length).to.equal(1);
      expect(buyer2Tickets[0]).to.equal("B-01");
    });
  });

  describe("Event Management", function () {
    it("Should allow issuer to deactivate event", async function () {
      await monadTicketSale.connect(issuer).deactivateEvent(1);

      const events = await monadTicketSale.getAllEvents();
      expect(events[0].isActive).to.equal(false);
    });

    it("Should prevent ticket purchase on deactivated event", async function () {
      const seatId = "A-02";
      const price = ethers.parseEther("1.0");

      await expect(monadTicketSale.connect(buyer1).buyTicket(1, seatId, { value: price })).to.be.revertedWith(
        "Event not active",
      );
    });

    it("Should not allow non-issuer to deactivate event", async function () {
      // First, create a new event to test
      const eventDate = Math.floor(Date.now() / 1000) + 86400 * 30;
      await monadTicketSale
        .connect(issuer)
        .createEvent("Test Event", eventDate, ["VIP"], [ethers.parseEther("1.0")], [1], [["X-01"]]);

      await expect(monadTicketSale.connect(buyer1).deactivateEvent(2)).to.be.revertedWith("Not event issuer");
    });
  });

  describe("Events by Issuer", function () {
    it("Should retrieve events by issuer", async function () {
      const issuerEvents = await monadTicketSale.getEventsByIssuer(issuer.address);
      expect(issuerEvents.length).to.equal(2);
      expect(issuerEvents[0].name).to.equal("BTS Concert");
      expect(issuerEvents[1].name).to.equal("Test Event");
    });

    it("Should return empty array for issuer with no events", async function () {
      const noEvents = await monadTicketSale.getEventsByIssuer(buyer1.address);
      expect(noEvents.length).to.equal(0);
    });
  });

  describe("NFT Transfer", function () {
    it("Should allow ticket transfer between users", async function () {
      // buyer1 transfers A-01 to buyer2
      await monadTicketSale.connect(buyer1).transferFrom(buyer1.address, buyer2.address, 1);

      expect(await monadTicketSale.ownerOf(1)).to.equal(buyer2.address);
      expect(await monadTicketSale.balanceOf(buyer1.address)).to.equal(0);
      expect(await monadTicketSale.balanceOf(buyer2.address)).to.equal(2); // B-01 + A-01
    });

    it("Should update seat status after transfer", async function () {
      const result = await monadTicketSale.getEventAllSeatsWithStatus(1);

      // A-01 should now be owned by buyer2
      expect(result.owners[0]).to.equal(buyer2.address);
      expect(result.availabilities[0]).to.equal(false);
    });
  });

  describe("Settlement System", function () {
    let settlementEventId: bigint;
    const vipPrice = ethers.parseEther("1.0");
    const standardPrice = ethers.parseEther("0.5");

    before(async () => {
      // Create a new event for settlement tests (far in the future to avoid time manipulation issues)
      const eventDate = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now
      await monadTicketSale.connect(issuer).createEvent(
        "Settlement Event",
        eventDate,
        ["VIP", "Standard"],
        [vipPrice, standardPrice],
        [2, 2],
        [
          ["S-01", "S-02"],
          ["S-03", "S-04"],
        ],
      );
      settlementEventId = 3n; // This should be the 3rd event
    });

    it("Should store revenue in contract when tickets are purchased", async function () {
      const platformFeeBalanceBefore = await monadTicketSale.platformFeeBalance();

      await monadTicketSale.connect(buyer1).buyTicket(settlementEventId, "S-01", { value: vipPrice });

      const revenue = await monadTicketSale.eventRevenue(settlementEventId);
      const platformFee = (vipPrice * 2n) / 100n; // 2% fee
      const expectedRevenue = vipPrice - platformFee;

      expect(revenue).to.equal(expectedRevenue);
      expect(await monadTicketSale.platformFeeBalance()).to.equal(platformFeeBalanceBefore + platformFee);
    });

    it("Should accumulate revenue from multiple ticket sales", async function () {
      await monadTicketSale.connect(buyer2).buyTicket(settlementEventId, "S-03", { value: standardPrice });

      const totalPaid = vipPrice + standardPrice;
      const platformFee = (totalPaid * 2n) / 100n;
      const expectedRevenue = totalPaid - platformFee;

      const revenue = await monadTicketSale.eventRevenue(settlementEventId);
      expect(revenue).to.equal(expectedRevenue);
    });

    it("Should not allow withdrawal before event ends", async function () {
      await expect(monadTicketSale.connect(issuer).withdrawEventRevenue(settlementEventId)).to.be.revertedWith(
        "Event not ended yet",
      );
    });

    it("Should return zero for withdrawable revenue before event ends", async function () {
      const withdrawable = await monadTicketSale.getWithdrawableRevenue(settlementEventId);
      expect(withdrawable).to.equal(0);
    });

    it("Should allow withdrawal after event ends", async function () {
      // Fast forward time by 31 days (event is 30 days from creation)
      await ethers.provider.send("evm_increaseTime", [86400 * 31]);
      await ethers.provider.send("evm_mine", []);

      const revenue = await monadTicketSale.eventRevenue(settlementEventId);
      const balanceBefore = await ethers.provider.getBalance(issuer.address);

      const tx = await monadTicketSale.connect(issuer).withdrawEventRevenue(settlementEventId);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(issuer.address);
      const expectedBalance = balanceBefore + revenue - gasUsed;

      expect(balanceAfter).to.equal(expectedBalance);
    });

    it("Should prevent double withdrawal", async function () {
      await expect(monadTicketSale.connect(issuer).withdrawEventRevenue(settlementEventId)).to.be.revertedWith(
        "Revenue already withdrawn",
      );
    });

    it("Should allow owner to withdraw platform fees", async function () {
      const platformFeeBalance = await monadTicketSale.platformFeeBalance();
      const signers = await ethers.getSigners();
      const owner = signers[0];

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await monadTicketSale.connect(owner).withdrawPlatformFee();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      const expectedBalance = balanceBefore + platformFeeBalance - gasUsed;

      expect(balanceAfter).to.equal(expectedBalance);
      expect(await monadTicketSale.platformFeeBalance()).to.equal(0);
    });

    it("Should not allow non-owner to withdraw platform fees", async function () {
      await expect(monadTicketSale.connect(issuer).withdrawPlatformFee()).to.be.revertedWithCustomError(
        monadTicketSale,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should not allow non-issuer to withdraw event revenue", async function () {
      // Create another event (event 4) in the far future
      const futureEventDate = Math.floor(Date.now() / 1000) + 86400 * 100; // 100 days from now
      await monadTicketSale
        .connect(issuer)
        .createEvent("Future Event", futureEventDate, ["VIP"], [vipPrice], [1], [["P-01"]]);

      // Fast forward past the event date
      await ethers.provider.send("evm_increaseTime", [86400 * 101]);
      await ethers.provider.send("evm_mine", []);

      // Try to withdraw as buyer1 (non-issuer)
      await expect(monadTicketSale.connect(buyer1).withdrawEventRevenue(4n)).to.be.revertedWith("Not event issuer");
    });
  });
});

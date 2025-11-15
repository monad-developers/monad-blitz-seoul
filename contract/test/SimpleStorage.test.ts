import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleStorage } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleStorage", function () {
  let simpleStorage: SimpleStorage;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorage.deploy(42);
    await simpleStorage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await simpleStorage.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct value", async function () {
      expect(await simpleStorage.retrieve()).to.equal(42);
    });

    it("Should emit ContractDeployed event", async function () {
      const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
      await expect(SimpleStorage.deploy(100))
        .to.emit(await SimpleStorage.deploy(100), "ContractDeployed")
        .withArgs(owner.address, 100);
    });
  });

  describe("Store", function () {
    it("Should store a new value", async function () {
      await simpleStorage.store(100);
      expect(await simpleStorage.retrieve()).to.equal(100);
    });

    it("Should emit ValueChanged event", async function () {
      await expect(simpleStorage.store(100))
        .to.emit(simpleStorage, "ValueChanged")
        .withArgs(42, 100, owner.address);
    });

    it("Should allow any address to store", async function () {
      await simpleStorage.connect(addr1).store(200);
      expect(await simpleStorage.retrieve()).to.equal(200);
    });
  });

  describe("Increment", function () {
    it("Should increment the value by 1", async function () {
      await simpleStorage.increment();
      expect(await simpleStorage.retrieve()).to.equal(43);
    });

    it("Should emit ValueChanged event on increment", async function () {
      await expect(simpleStorage.increment())
        .to.emit(simpleStorage, "ValueChanged")
        .withArgs(42, 43, owner.address);
    });
  });

  describe("Reset", function () {
    it("Should reset value to 0 when called by owner", async function () {
      await simpleStorage.reset();
      expect(await simpleStorage.retrieve()).to.equal(0);
    });

    it("Should revert when called by non-owner", async function () {
      await expect(simpleStorage.connect(addr1).reset())
        .to.be.revertedWithCustomError(simpleStorage, "NotOwner");
    });

    it("Should emit ValueChanged event on reset", async function () {
      await expect(simpleStorage.reset())
        .to.emit(simpleStorage, "ValueChanged")
        .withArgs(42, 0, owner.address);
    });
  });
});

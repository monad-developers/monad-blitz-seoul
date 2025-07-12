import { expect } from "chai";
import { ethers } from "hardhat";
import { Protocol } from "../typechain-types";

describe("YourContract", function () {
  // We define a fixture to reuse the same setup in every test.

  let ownerAddress: string;
  let protocolContract: Protocol;
  before(async () => {
    const [owner] = await ethers.getSigners();
    ownerAddress = owner.address;
    const protocolContractFactory = await ethers.getContractFactory("Protocol");
    protocolContract = (await protocolContractFactory.deploy({ from: owner.address })) as Protocol;
    await protocolContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("register user", async function () {
      // expect(await protocolContract.greeting()).to.equal("Building Unstoppable Apps!!!");
      await protocolContract.registerUser("test", "test location", 1);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await protocolContract.userMap(ownerAddress)).to.exist;
    });

    it("register store", async function () {
      // expect(await protocolContract.greeting()).to.equal("Building Unstoppable Apps!!!");
      await protocolContract.registerStore("test", "test store", "test location", 3);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await protocolContract.storeMap(ownerAddress)).to.exist;
    });

    it("register deliver", async function () {
      // expect(await protocolContract.greeting()).to.equal("Building Unstoppable Apps!!!");
      await protocolContract.registerDeliver("test");
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await protocolContract.deliverMap(ownerAddress)).to.exist;
    });

    it("add menu", async function () {
      // expect(await protocolContract.greeting()).to.equal("Building Unstoppable Apps!!!");
      await protocolContract.addMenu("test food", "test food", 100, "http://127.0.0.1");

      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(await protocolContract.getStoreMenu(ownerAddress)).to.exist;
      console.log(await protocolContract.getStoreMenu(ownerAddress));
    });
  });
});

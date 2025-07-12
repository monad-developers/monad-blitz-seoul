import { expect } from "chai";
import { ethers } from "hardhat";
import { InstantSwap, MockERC20 } from "../typechain-types";

describe("InstantSwap", function () {
  let mockETH: MockERC20;
  let mockLINK: MockERC20;
  let instantSwapContract: InstantSwap;

  let owner: any;
  let signer1: any;
  let signer2: any;
  let signer3: any;

  before(async () => {
    [owner, signer1, signer2, signer3] = await ethers.getSigners();

    // mockERC20 deploy
    const mockETHContractFactory = await ethers.getContractFactory("MockERC20");
    mockETH = (await mockETHContractFactory.deploy("Mock ETH", "ETH", signer1.address)) as MockERC20;
    await mockETH.waitForDeployment();
    const mockLINKContractFactory = await ethers.getContractFactory("MockERC20");
    mockLINK = (await mockLINKContractFactory.deploy("Mock LINK", "LINK", signer2.address)) as MockERC20;
    await mockLINK.waitForDeployment();

    // instantSwap deploy
    const instantSwapContractFactory = await ethers.getContractFactory("InstantSwap");
    instantSwapContract = (await instantSwapContractFactory.deploy()) as InstantSwap;
    await instantSwapContract.waitForDeployment();
  });

  describe("Instant Swap", function () {
    it("", async function () {
      const signer1ETHBalance = await mockETH.balanceOf(signer1.address);
      const signer2LINKBalance = await mockLINK.balanceOf(signer2.address);

      console.log("초기 잔액:");
      console.log("signer1 ETH 잔액:", ethers.formatEther(signer1ETHBalance));
      console.log("signer2 LINK 잔액:", ethers.formatEther(signer2LINKBalance));

      const order = {
        maker: signer1.address,
        taker: signer2.address,
        tokenM: await mockETH.getAddress(), // signer1이 제공할 토큰
        tokenT: await mockLINK.getAddress(), // signer2가 제공할 토큰
        amountM: ethers.parseEther("10"), // 10 ETH
        amountT: ethers.parseEther("5"), // 5 LINK
        expiry: Math.floor(Date.now() / 1000) + 3600, // 1시간 후 만료
        nonce: 1,
      };

      const domain = {
        name: "InstantSwap",
        version: "1",
        chainId: await ethers.provider.getNetwork().then(net => net.chainId),
        verifyingContract: await instantSwapContract.getAddress(),
      };

      const types = {
        SwapOrder: [
          { name: "maker", type: "address" },
          { name: "taker", type: "address" },
          { name: "tokenM", type: "address" },
          { name: "tokenT", type: "address" },
          { name: "amountM", type: "uint256" },
          { name: "amountT", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      // maker 토큰 승인 & 서명 생성
      await mockETH.connect(signer1).approve(await instantSwapContract.getAddress(), order.amountM);
      console.log("signer1이 ETH 토큰 승인 완료");
      const signature = await signer1.signTypedData(domain, types, order);
      console.log("signer1이 생성한 서명:", signature);

      await mockLINK.connect(signer2).approve(await instantSwapContract.getAddress(), order.amountT);
      console.log("signer2가 LINK 토큰 승인 완료");
      const tx = await instantSwapContract.connect(signer2).instantSwap(order, signature);
      const receipt = await tx.wait();
      console.log("instantSwap 트랜잭션 완료:", receipt?.hash);

      const signer1ETHBalanceAfter = await mockETH.balanceOf(signer1.address);
      const signer1LINKBalanceAfter = await mockLINK.balanceOf(signer1.address);
      const signer2ETHBalanceAfter = await mockETH.balanceOf(signer2.address);
      const signer2LINKBalanceAfter = await mockLINK.balanceOf(signer2.address);

      console.log("스왑 후 잔액:");
      console.log("signer1 ETH 잔액:", ethers.formatEther(signer1ETHBalanceAfter));
      console.log("signer1 LINK 잔액:", ethers.formatEther(signer1LINKBalanceAfter));
      console.log("signer2 ETH 잔액:", ethers.formatEther(signer2ETHBalanceAfter));
      console.log("signer2 LINK 잔액:", ethers.formatEther(signer2LINKBalanceAfter));
    });
  });
});

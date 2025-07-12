import { ethers } from "hardhat";

import { formatEther } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();

  // 배포된 컨트랙트 주소 (네트워크에 따라 다르게 설정)
  const CA = process.env.CONTRACT_ADDRESS ?? "";
  const game = await ethers.getContractAt("MonadClickerGame", CA);

  const currentOwner = await game.owner();

  console.log("TicketNFT owner:", currentOwner);
  console.log("Deployer address:", deployer.address);

  // const to = "0xF3368C7cB9565A18B297F051f9f9d3A85a920D1E"; // 티켓 받을 주소
  // const tokenId = 0;
  // const amount = 1;
  //
  // // mint 전 잔고
  const balanceBefore = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance before mint:", formatEther(balanceBefore), "ETH");

  // const tx = await game.createUser("0x7530782AE0bb964aff506Bc1248F91a9dca75Dc4");
  // console.log("Transaction sent:", tx.hash);

  // const tx = await game.attackEnemy("0x7530782AE0bb964aff506Bc1248F91a9dca75Dc4");
  // console.log("Transaction sent:", tx.hash);

  const user = await game.getUser("0x7530782AE0bb964aff506Bc1248F91a9dca75Dc4");
  console.log("User", user);

  const balanceAfter = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance after mint:", formatEther(balanceAfter), "ETH");

  const feeUsed = balanceBefore - balanceAfter;
  console.log("Gas fee used:", formatEther(feeUsed), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
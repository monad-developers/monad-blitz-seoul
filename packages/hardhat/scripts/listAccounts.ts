import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners();
  
  console.log("🔑 로컬 하드햇 계정 목록:");
  console.log("=====================================");
  
  for (let i = 0; i < Math.min(accounts.length, 10); i++) {
    const account = accounts[i];
    const balance = await ethers.provider.getBalance(account.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log(`Account ${i}:`);
    console.log(`  주소: ${account.address}`);
    console.log(`  잔액: ${balanceInEth} ETH`);
    console.log("");
  }
  
  console.log("📝 팬텀 지갑에 추가할 네트워크 정보:");
  console.log("=====================================");
  console.log("네트워크 이름: Hardhat Local");
  console.log("RPC URL: http://127.0.0.1:8545");
  console.log("체인 ID: 31337");
  console.log("통화 기호: ETH");
  console.log("블록 익스플로러: (없음)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
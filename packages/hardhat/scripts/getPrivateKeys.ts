import { ethers } from "hardhat";

async function main() {
  // 하드햇 기본 개인키들 (테스트용)
  const testPrivateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account 0
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account 1  
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account 2
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account 3
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account 4
  ];

  console.log("🔑 테스트용 계정 개인키 (팬텀에 import 용):");
  console.log("==========================================");
  console.log("⚠️  주의: 이 키들은 테스트용입니다. 실제 자금을 절대 보내지 마세요!");
  console.log("");

  for (let i = 0; i < testPrivateKeys.length; i++) {
    const wallet = new ethers.Wallet(testPrivateKeys[i]);
    const balance = await ethers.provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log(`Account ${i}:`);
    console.log(`  주소: ${wallet.address}`);
    console.log(`  개인키: ${testPrivateKeys[i]}`);
    console.log(`  잔액: ${balanceInEth} ETH`);
    console.log("");
  }

  console.log("📋 팬텀 지갑에 계정 추가 방법:");
  console.log("1. 팬텀 지갑 열기");
  console.log("2. 설정 → 계정/키 가져오기");
  console.log("3. 위의 개인키 중 하나를 붙여넣기");
  console.log("4. 로컬 네트워크로 전환하면 10,000 ETH가 있는 계정 사용 가능!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
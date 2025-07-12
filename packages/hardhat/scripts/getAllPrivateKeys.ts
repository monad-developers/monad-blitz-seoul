import { ethers } from "hardhat";

async function main() {
  // 하드햇 기본 개인키들 (테스트용 - 모든 계정)
  const testPrivateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // Account 0
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Account 1  
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // Account 2
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // Account 3
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // Account 4
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba", // Account 5
    "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e", // Account 6
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356", // Account 7
    "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97", // Account 8
    "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6", // Account 9
  ];

  console.log("🔑 계정 2~9 개인키 (팬텀에 import 용):");
  console.log("==========================================");
  console.log("⚠️  주의: 이 키들은 테스트용입니다. 실제 자금을 절대 보내지 마세요!");
  console.log("");

  // Account 2~9만 보여주기
  for (let i = 2; i <= 9; i++) {
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
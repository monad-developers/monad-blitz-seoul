import { ethers } from "hardhat";

async function main() {
  console.log("🔑 새로운 로컬 계정 생성");
  console.log("============================");
  
  // 새로운 랜덤 지갑 생성
  const newWallet = ethers.Wallet.createRandom();
  
  console.log("✨ 새 계정이 생성되었습니다!");
  console.log("");
  console.log("📋 계정 정보:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏠 주소: ${newWallet.address}`);
  console.log(`🔐 개인키: ${newWallet.privateKey}`);
  console.log(`🌱 니모닉: ${newWallet.mnemonic?.phrase || 'N/A'}`);
  console.log("");
  
  console.log("⚠️  보안 주의사항:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("• 이 정보들은 테스트 전용입니다");
  console.log("• 실제 자금을 절대 보내지 마세요");
  console.log("• 개인키를 안전하게 보관하세요");
  console.log("");
  
  console.log("📱 MetaMask에 추가하는 방법:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. MetaMask 열기");
  console.log("2. 계정 메뉴 → '계정 가져오기' 클릭");
  console.log("3. '개인 키' 선택");
  console.log(`4. 개인키 입력: ${newWallet.privateKey}`);
  console.log("5. '가져오기' 클릭");
  console.log("");
  
  console.log("💰 로컬 ETH 받는 방법:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("아래 스크립트를 실행하여 10,000 ETH를 받으세요:");
  console.log(`yarn hardhat run scripts/sendETH.ts --network hardhat ${newWallet.address}`);
  console.log("");
  
  // 기본 계정에서 새 계정으로 ETH 전송
  try {
    const [deployer] = await ethers.getSigners();
    const amount = ethers.parseEther("10000"); // 10,000 ETH
    
    console.log("💸 ETH 전송 중...");
    console.log(`${deployer.address} → ${newWallet.address}`);
    
    const tx = await deployer.sendTransaction({
      to: newWallet.address,
      value: amount
    });
    
    await tx.wait();
    
    // 잔액 확인
    const balance = await ethers.provider.getBalance(newWallet.address);
    const balanceInEth = ethers.formatEther(balance);
    
    console.log("✅ ETH 전송 완료!");
    console.log(`💰 새 계정 잔액: ${balanceInEth} ETH`);
    console.log("");
    
    console.log("🎉 모든 설정 완료!");
    console.log("이제 MetaMask에서 이 계정을 사용할 수 있습니다.");
    
  } catch (error) {
    console.error("❌ ETH 전송 실패:", error);
    console.log("");
    console.log("수동으로 ETH를 전송하려면:");
    console.log(`yarn hardhat run scripts/sendETH.ts --network hardhat ${newWallet.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
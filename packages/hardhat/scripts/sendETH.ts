import { ethers } from "hardhat";

async function main() {
  // 명령행 인수에서 받는 주소 확인
  const targetAddress = process.argv[2];
  
  if (!targetAddress) {
    console.log("사용법: yarn hardhat run scripts/sendETH.ts --network hardhat <주소>");
    console.log("예시: yarn hardhat run scripts/sendETH.ts --network hardhat 0x1234...");
    return;
  }
  
  console.log("💸 ETH 전송 스크립트");
  console.log("====================");
  
  try {
    // 주소 유효성 검사
    if (!ethers.isAddress(targetAddress)) {
      throw new Error("유효하지 않은 이더리움 주소입니다");
    }
    
    const [deployer] = await ethers.getSigners();
    const amount = ethers.parseEther("10000"); // 10,000 ETH
    
    console.log(`보내는 계정: ${deployer.address}`);
    console.log(`받는 계정: ${targetAddress}`);
    console.log(`전송 금액: 10,000 ETH`);
    console.log("");
    
    // 전송 전 잔액 확인
    const senderBalance = await ethers.provider.getBalance(deployer.address);
    const receiverBalance = await ethers.provider.getBalance(targetAddress);
    
    console.log("전송 전 잔액:");
    console.log(`• 보내는 계정: ${ethers.formatEther(senderBalance)} ETH`);
    console.log(`• 받는 계정: ${ethers.formatEther(receiverBalance)} ETH`);
    console.log("");
    
    // ETH 전송
    console.log("💰 ETH 전송 중...");
    const tx = await deployer.sendTransaction({
      to: targetAddress,
      value: amount
    });
    
    console.log(`📄 트랜잭션 해시: ${tx.hash}`);
    
    // 트랜잭션 확인 대기
    const receipt = await tx.wait();
    console.log(`✅ 트랜잭션 확인됨 (블록 ${receipt?.blockNumber})`);
    console.log("");
    
    // 전송 후 잔액 확인
    const newSenderBalance = await ethers.provider.getBalance(deployer.address);
    const newReceiverBalance = await ethers.provider.getBalance(targetAddress);
    
    console.log("전송 후 잔액:");
    console.log(`• 보내는 계정: ${ethers.formatEther(newSenderBalance)} ETH`);
    console.log(`• 받는 계정: ${ethers.formatEther(newReceiverBalance)} ETH`);
    console.log("");
    
    console.log("🎉 ETH 전송 완료!");
    console.log("이제 MetaMask에서 새 계정을 사용할 수 있습니다.");
    
  } catch (error) {
    console.error("❌ ETH 전송 실패:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
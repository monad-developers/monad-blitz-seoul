import { ethers } from "hardhat";

async function main() {
  const [owner, user1] = await ethers.getSigners();
  
  console.log("🧪 ERC1155 ProfileNFT 테스트 시작");
  console.log("==========================================");
  
  // 컨트랙트 가져오기
  const ProfileNFT1155 = await ethers.getContractFactory("ProfileNFT1155");
  console.log("✅ 컨트랙트 팩토리 로드 완료");
  
  // 배포된 컨트랙트 연결
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const contract = ProfileNFT1155.attach(contractAddress);
  console.log("✅ 컨트랙트 연결 완료");
  
  // 1. 프로필 생성 테스트
  console.log("\n📝 Step 1: 프로필 생성 테스트");
  
  const profileExists = await contract.profileExists(user1.address);
  console.log(`User1 프로필 존재 여부: ${profileExists}`);
  
  if (!profileExists) {
    const createTx = await contract.connect(user1).createProfile(
      "테스트 사용자",
      "ERC1155 테스터",
      "ERC1155 프로필 NFT를 테스트합니다",
      "Solidity, TypeScript, ERC1155",
      "@test_user",
      "https://test.portfolio.com",
      ["https://test.file1.com", "https://test.file2.com"]
    );
    
    await createTx.wait();
    console.log("✅ 프로필 생성 완료");
  }
  
  // 2. NFT 민팅 테스트
  console.log("\n🎨 Step 2: ERC1155 NFT 민팅 테스트");
  
  const metadataUri = "https://example.com/metadata/1.json";
  const mintTx = await contract.connect(owner).mintProfileNFT(user1.address, metadataUri);
  await mintTx.wait();
  
  console.log("✅ ERC1155 NFT 민팅 완료");
  
  // 3. 토큰 소유권 확인
  console.log("\n🔍 Step 3: 토큰 소유권 확인");
  
  const totalMinted = await contract.totalMintedTokens();
  console.log(`총 민팅된 토큰 수: ${totalMinted}`);
  
  const userTokens = await contract.getUserTokens(user1.address);
  console.log(`User1이 소유한 토큰들: [${userTokens.join(", ")}]`);
  
  if (userTokens.length > 0) {
    const tokenId = userTokens[0];
    const balance = await contract.balanceOf(user1.address, tokenId);
    console.log(`토큰 ID ${tokenId} 소유 수량: ${balance}`);
    
    const tokenUri = await contract.uri(tokenId);
    console.log(`토큰 URI: ${tokenUri}`);
    
    const tokenInfo = await contract.getTokenInfo(tokenId);
    console.log(`토큰 정보:`, {
      tokenId: tokenInfo[0].toString(),
      owner: tokenInfo[1],
      metadataUri: tokenInfo[2],
      mintedAt: new Date(Number(tokenInfo[3]) * 1000).toISOString(),
      tokenType: tokenInfo[4].toString()
    });
  }
  
  // 4. ERC1155 배치 기능 테스트
  console.log("\n🔧 Step 4: ERC1155 인터페이스 지원 확인");
  
  const erc1155InterfaceId = "0xd9b67a26"; // ERC1155 interface ID
  const supportsERC1155 = await contract.supportsInterface(erc1155InterfaceId);
  console.log(`ERC1155 인터페이스 지원: ${supportsERC1155}`);
  
  console.log("\n🎉 ERC1155 ProfileNFT 테스트 완료!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 테스트 실패:", error);
    process.exit(1);
  });
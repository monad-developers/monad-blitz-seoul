import { ethers } from "hardhat";

async function main() {
  console.log("🔍 민팅된 프로필 데이터 확인");
  console.log("================================");
  
  try {
    // ProfileNFT1155 컨트랙트 연결
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 최신 주소 사용
    const ProfileNFT1155 = await ethers.getContractFactory("ProfileNFT1155");
    const contract = ProfileNFT1155.attach(contractAddress);
    
    console.log(`📄 컨트랙트 주소: ${contractAddress}`);
    
    // 총 민팅된 토큰 수 확인 (nextTokenId - 1)
    const nextTokenId = await contract.nextTokenId();
    const totalMinted = nextTokenId - 1n;
    console.log(`📊 다음 토큰 ID: ${nextTokenId}`);
    console.log(`📊 총 민팅된 토큰 수: ${totalMinted}`);
    
    if (totalMinted <= 0n) {
      console.log("ℹ️ 아직 민팅된 토큰이 없습니다.");
      return;
    }
    
    // 각 토큰 정보 조회
    for (let tokenId = 1; tokenId <= Number(totalMinted); tokenId++) {
      console.log(`\n🪙 Token ID ${tokenId} 정보:`);
      console.log("------------------------");
      
      try {
        // 토큰 정보 조회
        const tokenInfo = await contract.getTokenInfo(tokenId);
        const [id, owner, metadataUri, mintedAt, tokenType] = tokenInfo;
        
        console.log(`  토큰 ID: ${id}`);
        console.log(`  소유자: ${owner}`);
        console.log(`  메타데이터 URI: ${metadataUri}`);
        console.log(`  민팅 시간: ${new Date(Number(mintedAt) * 1000).toISOString()}`);
        console.log(`  토큰 타입: ${tokenType}`);
        
        // 프로필 정보 조회
        try {
          const profileInfo = await contract.getProfileByWallet(owner);
          const [
            walletAddress,
            name,
            role,
            introduction,
            skills,
            contact,
            portfolioLink,
            fileUrls,
            profileMetadataUri,
            timestamp
          ] = profileInfo;
          
          console.log(`\n👤 프로필 정보:`);
          console.log(`  이름: ${name}`);
          console.log(`  역할: ${role}`);
          console.log(`  소개: ${introduction}`);
          console.log(`  스킬: ${skills}`);
          console.log(`  연락처: ${contact}`);
          console.log(`  포트폴리오: ${portfolioLink}`);
          console.log(`  파일 URLs: [${fileUrls.join(', ')}]`);
          console.log(`  프로필 생성 시간: ${new Date(Number(timestamp) * 1000).toISOString()}`);
          
          // 이미지 URL 분석
          if (fileUrls.length > 0) {
            console.log(`\n📁 파일 분석:`);
            fileUrls.forEach((url, index) => {
              const isImage = url.includes('image') || 
                             url.includes('.jpg') || 
                             url.includes('.jpeg') || 
                             url.includes('.png') || 
                             url.includes('.gif') || 
                             url.includes('.webp');
              console.log(`  [${index}] ${isImage ? '🖼️ (이미지)' : '📄 (기타)'} ${url}`);
            });
          } else {
            console.log(`  ⚠️ 파일 URL이 없습니다.`);
          }
          
        } catch (profileError) {
          console.error(`  ❌ 프로필 정보 조회 실패:`, profileError);
        }
        
      } catch (tokenError) {
        console.error(`❌ 토큰 ID ${tokenId} 조회 실패:`, tokenError);
      }
    }
    
  } catch (error) {
    console.error("❌ 프로필 확인 중 오류:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
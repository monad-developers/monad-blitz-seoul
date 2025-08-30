const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers found. Please check your private key configuration.");
  }
  const deployer = signers[0];
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. MockUSDT 배포
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  console.log("MockUSDT deployed to:", await mockUSDT.getAddress());

  // 2. MonaDAOToken 배포
  const MonaDAOToken = await ethers.getContractFactory("MonaDAOToken");
  const daoToken = await MonaDAOToken.deploy(
    "MonaDAO Token",
    "MONA",
    ethers.parseEther("1000000"), // 1,000,000 토큰
    deployer.address
  );
  await daoToken.waitForDeployment();
  console.log("MonaDAOToken deployed to:", await daoToken.getAddress());

  // 3. MonaDAO 메인 컨트랙트 배포
  const MonaDAO = await ethers.getContractFactory("MonaDAO");
  const monaDAO = await MonaDAO.deploy(
    await mockUSDT.getAddress(),
    await daoToken.getAddress()
  );
  await monaDAO.waitForDeployment();
  console.log("MonaDAO deployed to:", await monaDAO.getAddress());

  // 4. 초기 설정
  // DAO 토큰의 소유권을 MonaDAO 컨트랙트에 이전
  await daoToken.transferOwnership(await monaDAO.getAddress());
  console.log("DAO Token ownership transferred to MonaDAO contract");

  // 테스트용 USDT 민팅
  await mockUSDT.mint(deployer.address, ethers.parseUnits("10000", 6)); // 10,000 USDT
  console.log("Minted 10,000 USDT to deployer");

  console.log("\n=== Deployment Summary ===");
  console.log("MockUSDT:", await mockUSDT.getAddress());
  console.log("MonaDAOToken:", await daoToken.getAddress());
  console.log("MonaDAO:", await monaDAO.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("========================\n");

  // 환경 변수 파일 생성
  const envContent = `# Contract Addresses
NEXT_PUBLIC_USDT_ADDRESS=${await mockUSDT.getAddress()}
NEXT_PUBLIC_DAO_TOKEN_ADDRESS=${await daoToken.getAddress()}
NEXT_PUBLIC_MONA_DAO_ADDRESS=${await monaDAO.getAddress()}
NEXT_PUBLIC_DEPLOYER_ADDRESS=${deployer.address}

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://explorer.monad-testnet.category.xyz/api/eth-rpc
`;

  const fs = require('fs');
  fs.writeFileSync('../frontend/.env.local', envContent);
  console.log("Environment file created at frontend/.env.local");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

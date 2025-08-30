import { ethers } from 'ethers';

// 컨트랙트 주소들 (배포 후 업데이트 필요)
export const CONTRACT_ADDRESSES = {
  MUSIC_COLLABORATION_HUB: '0x0000000000000000000000000000000000000000' as `0x${string}`,  // 배포 후 업데이트
  PROJECT_NFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,              // 배포 후 업데이트
  SPLITTER_FACTORY: '0x0000000000000000000000000000000000000000' as `0x${string}`          // 배포 후 업데이트
};

// ABI 정의
export const MUSIC_COLLABORATION_HUB_ABI = [
  // 프로젝트 생성
  "function createProject(string calldata genre, uint256 budgetUsd, uint64 deadline, uint64 dstChainSelector) external returns (uint256)",
  
  // 협업자 관리
  "function approveCollaborators(uint256 id, address[] calldata agents) external",
  "function setContributionBps(uint256 id, uint16[] calldata bps) external",
  
  // 프로젝트 상태 관리
  "function openProject(uint256 id) external",
  "function activateProject(uint256 id) external",
  "function lockProject(uint256 id) external",
  "function cancelProject(uint256 id) external",
  
  // 수익 분배
  "function createProjectSplitter(uint256 id) external returns (address)",
  "function depositRevenue(uint256 id, address token, uint256 amount) external payable",
  
  // 조회 함수들
  "function getProjectBase(uint256 id) external view returns (uint256, address, string memory, uint256, uint64, uint8)",
  "function getCollaborators(uint256 id) external view returns (address[])",
  "function getContributionBps(uint256 id) external view returns (uint16[])",
  "function getProjectMetadata(uint256 id) external view returns (string, bytes32, address, string, uint256)",
  
  // 이벤트들
  "event ProjectCreated(uint256 indexed id, address indexed creator, string genre, uint256 budgetUsd, uint64 deadline)",
  "event CollaboratorsApproved(uint256 indexed id, address[] collaborators)",
  "event ContributionBpsUpdated(uint256 indexed id, uint16[] bps)",
  "event ProjectOpened(uint256 indexed id)",
  "event ProjectActivated(uint256 indexed id)",
  "event ProjectLocked(uint256 indexed id)",
  "event ProjectCanceled(uint256 indexed id)",
  "event Finalized(uint256 indexed id, bytes32 finalHash, address splitter, uint256 nftTokenId)",
  "event RevenueDeposited(uint256 indexed id, address indexed token, uint256 amount, address from)"
];

// 컨트랙트 인스턴스 생성 함수
export const getContract = (
  address: string,
  abi: any[],
  signer?: ethers.Signer | ethers.providers.Provider
) => {
  return new ethers.Contract(address, abi, signer);
};

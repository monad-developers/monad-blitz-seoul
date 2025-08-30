import { ethers } from 'ethers';

// Network Configurations
export const SEPOLIA_NETWORK = {
  chainId: '0xaa36a7', // 11155111
  chainName: 'Sepolia Testnet',
  rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18
  },
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

export const MONAD_NETWORK = {
  chainId: '0x29a92914', // 698932603
  chainName: 'Monad Testnet',
  rpcUrls: ['https://testnet-rpc.monad.network'],
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18
  },
  blockExplorerUrls: ['https://testnet-explorer.monad.network']
};

// Contract Addresses
export const CONTRACT_ADDRESSES = {
  SEPOLIA_GATEWAY: process.env.NEXT_PUBLIC_SEPOLIA_GATEWAY_ADDRESS || '',
  MUSIC_HUB: process.env.NEXT_PUBLIC_MUSIC_HUB_ADDRESS || '',
  LINK_TOKEN: process.env.NEXT_PUBLIC_LINK_TOKEN_ADDRESS || ''
};

// Contract ABIs
export const SEPOLIA_GATEWAY_ABI = [
  "function createMusicProject(string memory s3Url, address[] memory collaborators) external returns (bytes32)",
  "function addContributionToProject(uint256 projectId, string memory contributionS3Url, string memory description) external returns (bytes32)",
  "function requestAIRemix(uint256 projectId) external returns (bytes32)",
  "function getUserProjects(address user) external view returns (uint256[])",
  "event ProjectSentToMonad(bytes32 indexed messageId, address indexed creator, string s3Url, uint256 fees)",
  "event ContributionSentToMonad(bytes32 indexed messageId, uint256 indexed projectId, address indexed contributor, string s3Url)",
  "event ProjectRemixedFromMonad(uint256 indexed projectId, string newMixedUrl, uint256 versionNumber, address indexed creator)"
];

export const MUSIC_HUB_ABI = [
  "function getProject(uint256 projectId) external view returns (tuple(string originalS3Url, string[] contributionUrls, string currentMixedUrl, address creator, address[] collaborators, uint256 createdAt, uint256 lastUpdated, bool isActive, uint256 versionCount))",
  "function getProjectContributions(uint256 projectId) external view returns (tuple(address contributor, string s3Url, uint256 timestamp, string description)[])",
  "function getUserProjects(address user) external view returns (uint256[])"
];

// S3 Configuration
export const S3_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || '',
  bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '',
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
};

// Web3 Helper Functions
export const switchNetwork = async (networkParams: typeof SEPOLIA_NETWORK | typeof MONAD_NETWORK) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkParams.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkParams],
        });
      } catch (addError) {
        console.error('Failed to add network:', addError);
        throw addError;
      }
    } else {
      console.error('Failed to switch network:', switchError);
      throw switchError;
    }
  }
};

// Get Web3 Provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  throw new Error('No Web3 Provider found');
};

// Get Contract Instance
export const getContract = (address: string, abi: any[], signer: ethers.Signer) => {
  return new ethers.Contract(address, abi, signer);
};

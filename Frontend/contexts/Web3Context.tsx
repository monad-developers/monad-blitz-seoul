import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  getProvider,
  switchNetwork,
  SEPOLIA_NETWORK,
  CONTRACT_ADDRESSES,
  SEPOLIA_GATEWAY_ABI,
} from '../config/web3';

interface ProjectContribution {
  contributor: string;
  s3Url: string;
  timestamp: number;
  description: string;
}

interface Project {
  originalS3Url: string;
  contributionUrls: string[];
  currentMixedUrl: string;
  creator: string;
  collaborators: string[];
  createdAt: number;
  lastUpdated: number;
  isActive: boolean;
  versionCount: number;
}

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  createMusicProject: (s3Url: string, collaborators: string[]) => Promise<string>;
  addContribution: (projectId: number, s3Url: string, description: string) => Promise<string>;
  requestRemix: (projectId: number) => Promise<string>;
  getProject: (projectId: number) => Promise<Project>;
  getProjectContributions: (projectId: number) => Promise<ProjectContribution[]>;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  isConnected: false,
  isLoading: true,
  connectWallet: async () => {},
  createMusicProject: async () => '',
  addContribution: async () => '',
  requestRemix: async () => '',
  getProject: async () => ({
    originalS3Url: '',
    contributionUrls: [],
    currentMixedUrl: '',
    creator: '',
    collaborators: [],
    createdAt: 0,
    lastUpdated: 0,
    isActive: false,
    versionCount: 0
  }),
  getProjectContributions: async () => [],
  error: null,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setIsConnected(true);
    } else {
      setAccount(null);
      setIsConnected(false);
    }
  };

  const checkConnection = async () => {
    try {
      if (window.ethereum) {
        const provider = getProvider();
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      }
    } catch (err) {
      console.error('Failed to check wallet connection:', err);
      setError('Failed to check wallet connection');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }

      const provider = getProvider();
      await switchNetwork(SEPOLIA_NETWORK);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    }
  };

  const createMusicProject = async (s3Url: string, collaborators: string[] = []) => {
    try {
      setError(null);
      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      const provider = getProvider();
      const signer = provider.getSigner();
      
      // Switch to Sepolia network
      await switchNetwork(SEPOLIA_NETWORK);

      // Get contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        SEPOLIA_GATEWAY_ABI,
        signer
      );

      // Approve LINK token if needed
      const linkContract = new ethers.Contract(
        CONTRACT_ADDRESSES.LINK_TOKEN,
        ["function approve(address spender, uint256 amount) external returns (bool)"],
        signer
      );
      
      await linkContract.approve(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        ethers.utils.parseEther("0.1")
      );

      // Create music project
      const tx = await contract.createMusicProject(s3Url, collaborators);
      const receipt = await tx.wait();

      // Get messageId from event
      const event = receipt.events?.find(
        (e: any) => e.event === 'ProjectSentToMonad'
      );
      
      if (!event) {
        throw new Error('Failed to get project ID from transaction');
      }

      return event.args.messageId;
    } catch (err: any) {
      console.error('Failed to create music project:', err);
      setError(err.message || 'Failed to create music project');
      throw err;
    }
  };

  const addContribution = async (projectId: number, s3Url: string, description: string) => {
    try {
      setError(null);
      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      const provider = getProvider();
      const signer = provider.getSigner();
      
      await switchNetwork(SEPOLIA_NETWORK);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        SEPOLIA_GATEWAY_ABI,
        signer
      );

      const linkContract = new ethers.Contract(
        CONTRACT_ADDRESSES.LINK_TOKEN,
        ["function approve(address spender, uint256 amount) external returns (bool)"],
        signer
      );
      
      await linkContract.approve(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        ethers.utils.parseEther("0.05")
      );

      const tx = await contract.addContributionToProject(projectId, s3Url, description);
      const receipt = await tx.wait();

      const event = receipt.events?.find(
        (e: any) => e.event === 'ContributionSentToMonad'
      );
      
      if (!event) {
        throw new Error('Failed to get contribution ID from transaction');
      }

      return event.args.messageId;
    } catch (err: any) {
      console.error('Failed to add contribution:', err);
      setError(err.message || 'Failed to add contribution');
      throw err;
    }
  };

  const requestRemix = async (projectId: number) => {
    try {
      setError(null);
      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      const provider = getProvider();
      const signer = provider.getSigner();
      
      await switchNetwork(SEPOLIA_NETWORK);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        SEPOLIA_GATEWAY_ABI,
        signer
      );

      const linkContract = new ethers.Contract(
        CONTRACT_ADDRESSES.LINK_TOKEN,
        ["function approve(address spender, uint256 amount) external returns (bool)"],
        signer
      );
      
      await linkContract.approve(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        ethers.utils.parseEther("0.1")
      );

      const tx = await contract.requestAIRemix(projectId);
      const receipt = await tx.wait();

      return receipt.transactionHash;
    } catch (err: any) {
      console.error('Failed to request remix:', err);
      setError(err.message || 'Failed to request remix');
      throw err;
    }
  };

  const getProject = async (projectId: number): Promise<Project> => {
    try {
      setError(null);
      const provider = getProvider();
      
      await switchNetwork(SEPOLIA_NETWORK);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.MUSIC_HUB,
        MUSIC_HUB_ABI,
        provider
      );

      const project = await contract.getProject(projectId);
      return {
        originalS3Url: project.originalS3Url,
        contributionUrls: project.contributionUrls,
        currentMixedUrl: project.currentMixedUrl,
        creator: project.creator,
        collaborators: project.collaborators,
        createdAt: project.createdAt.toNumber(),
        lastUpdated: project.lastUpdated.toNumber(),
        isActive: project.isActive,
        versionCount: project.versionCount.toNumber()
      };
    } catch (err: any) {
      console.error('Failed to get project:', err);
      setError(err.message || 'Failed to get project');
      throw err;
    }
  };

  const getProjectContributions = async (projectId: number): Promise<ProjectContribution[]> => {
    try {
      setError(null);
      const provider = getProvider();
      
      await switchNetwork(SEPOLIA_NETWORK);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.MUSIC_HUB,
        MUSIC_HUB_ABI,
        provider
      );

      const contributions = await contract.getProjectContributions(projectId);
      return contributions.map((c: any) => ({
        contributor: c.contributor,
        s3Url: c.s3Url,
        timestamp: c.timestamp.toNumber(),
        description: c.description
      }));
    } catch (err: any) {
      console.error('Failed to get project contributions:', err);
      setError(err.message || 'Failed to get project contributions');
      throw err;
    }
  };

  const value = {
    account,
    isConnected,
    isLoading,
    connectWallet,
    createMusicProject,
    addContribution,
    requestRemix,
    getProject,
    getProjectContributions,
    error,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

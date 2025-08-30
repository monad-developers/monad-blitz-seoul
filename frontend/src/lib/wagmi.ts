import { getDefaultConfig } from '@rainbow-me/rainbowkit';

import {
  metaMaskWallet,
  injectedWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Define Monad networks
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Testnet Explorer',
      url: 'https://testnet.monad.xyz',
    },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'MonadDAO',
  projectId: '3314f21eac5f2fd48f68c0f7a2b9208a', // WalletConnect 프로젝트 ID
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, injectedWallet, phantomWallet],
    },
  ],
  chains: [monadTestnet],
  ssr: true,
});

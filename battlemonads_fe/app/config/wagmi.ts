import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { metaMask, injected } from 'wagmi/connectors';

// Define Monad Testnet chain
export const monadTestnet = defineChain({
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
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet-explorer.monad.xyz',
    },
  },
  testnet: true,
});

// Create wagmi config
export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Battle Monads',
        url: 'https://battlemonads.com',
      },
    }),
    injected(),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
});
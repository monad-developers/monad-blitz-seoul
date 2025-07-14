import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Define Monad testnet chain
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    metaMask(),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? [
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      })
    ] : []),
    coinbaseWallet({
      appName: 'Monad Lisa',
    }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
})
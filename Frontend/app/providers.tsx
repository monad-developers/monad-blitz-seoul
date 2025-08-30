'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, zora, sepolia } from 'viem/chains';
import { Web3Provider } from '../contexts/Web3Context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from 'react-hot-toast';

const projectId = '2767e393b9e15c1c7036a2e2af0f08d2';

const config = getDefaultConfig({
  appName: 'MusicWithNow',
  projectId,
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, base, zora],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#744CCC',
            accentColorForeground: 'white',
            borderRadius: 'large',
          })}
        >
          <Web3Provider>
            {children}
            <Toaster position="bottom-right" />
          </Web3Provider>
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

/**
 * Wagmi Configuration for Monad Testnet
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';
import { monadTestnet } from './chains';

// Monad Testnet을 기본으로 사용
const chains: readonly [Chain, ...Chain[]] = [monadTestnet, mainnet];

export const config = getDefaultConfig({
    appName: 'Minecraft PFP NFT',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    chains,
    ssr: true,
});

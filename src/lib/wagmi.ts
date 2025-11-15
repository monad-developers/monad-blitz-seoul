/**
 * Wagmi Configuration for Monad Testnet
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';
import { monadTestnet, sepolia } from './chains';

// Monad Testnet과 Sepolia를 지원
const chains: readonly [Chain, ...Chain[]] = [monadTestnet, sepolia, mainnet];

let cachedConfig: ReturnType<typeof getDefaultConfig> | null = null;

export function getConfig() {
    if (!cachedConfig) {
        cachedConfig = getDefaultConfig({
            appName: 'Minecraft PFP NFT',
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
            chains,
            ssr: false,
        });
    }
    return cachedConfig;
}

// 호환성을 위한 export
export const config = typeof window !== 'undefined' ? getConfig() : {} as ReturnType<typeof getDefaultConfig>;

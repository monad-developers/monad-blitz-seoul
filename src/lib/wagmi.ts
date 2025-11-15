/**
 * Wagmi Configuration for Monad Testnet
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';
import { monadTestnet } from './chains';

// Monad Testnet을 기본으로 사용
const chains: readonly [Chain, ...Chain[]] = [monadTestnet, mainnet];

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

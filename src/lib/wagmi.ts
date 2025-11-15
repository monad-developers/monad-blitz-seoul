/**
 * Wagmi Configuration
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

const chains: readonly [Chain, ...Chain[]] =
    process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true'
        ? [sepolia, mainnet]
        : [mainnet];

export const config = getDefaultConfig({
    appName: 'Minecraft PFP NFT',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    chains,
    ssr: true,
});

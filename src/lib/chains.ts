/**
 * Custom Chain Definitions
 */

import { defineChain } from 'viem';

/**
 * Monad Testnet
 * Chain ID: 10143
 */
export const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: {
        name: 'MON',
        symbol: 'MON',
        decimals: 18,
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
            name: 'Monad Explorer (BlockVision)',
            url: 'https://testnet.monadexplorer.com',
        },
        etherscan: {
            name: 'Monad Scan',
            url: 'https://testnet.monadscan.com',
        },
    },
    testnet: true,
});

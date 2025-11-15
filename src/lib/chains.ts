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

/**
 * Sepolia Testnet
 * Chain ID: 11155111
 */
export const sepolia = defineChain({
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: {
        name: 'Sepolia ETH',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'],
        },
        public: {
            http: ['https://rpc.sepolia.org'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Etherscan',
            url: 'https://sepolia.etherscan.io',
        },
    },
    testnet: true,
});

/**
 * CCIP Configuration
 */
export const CCIP_CONFIG = {
    sepolia: {
        router: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
        chainSelector: '16015286601757825753',
        linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789'
    },
    monad: {
        router: process.env.NEXT_PUBLIC_MONAD_CCIP_ROUTER || '',
        chainSelector: '2183018362218727504'
    }
} as const;

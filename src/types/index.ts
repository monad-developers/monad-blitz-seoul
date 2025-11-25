import { SkinTraits } from '../lib/traitGenerator';

/**
 * Wealth tier 정의
 */
export enum WealthTier {
    NONE = 0,
    BRONZE = 1,
    SILVER = 2,
    GOLD = 3,
    PLATINUM = 4,
    DIAMOND = 5,
}

export const WEALTH_TIER_NAMES: Record<WealthTier, string> = {
    [WealthTier.NONE]: 'None',
    [WealthTier.BRONZE]: 'Bronze',
    [WealthTier.SILVER]: 'Silver',
    [WealthTier.GOLD]: 'Gold',
    [WealthTier.PLATINUM]: 'Platinum',
    [WealthTier.DIAMOND]: 'Diamond',
};

export const WEALTH_TIER_THRESHOLDS: Record<WealthTier, number> = {
    [WealthTier.NONE]: 0,
    [WealthTier.BRONZE]: 1000,
    [WealthTier.SILVER]: 10000,
    [WealthTier.GOLD]: 50000,
    [WealthTier.PLATINUM]: 100000,
    [WealthTier.DIAMOND]: 500000,
};

/**
 * Special Item 정의
 */
export const SPECIAL_ITEMS = [
    // Tier 0
    'None',

    // Tier 1 (Bronze): 1-3
    'Wooden Sword',
    'Wooden Pickaxe',
    'Leather Boots',

    // Tier 2 (Silver): 4-6
    'Iron Sword',
    'Iron Pickaxe',
    'Iron Helmet',

    // Tier 3 (Gold): 7-10
    'Golden Sword',
    'Golden Pickaxe',
    'Golden Helmet',
    'Golden Apple',

    // Tier 4 (Platinum): 11-14
    'Diamond Sword',
    'Diamond Pickaxe',
    'Diamond Helmet',
    'Diamond Chestplate',

    // Tier 5 (Diamond): 15-19
    'Netherite Sword',
    'Netherite Pickaxe',
    'Netherite Helmet',
    'Enchanted Book',
    'Elytra',
] as const;

/**
 * Mint Preview 데이터
 */
export interface MintPreview {
    traits: SkinTraits;
    totalWealthUSD: number;
    wealthTier: WealthTier;
    specialItem: number;
    solValueUSD: number;
}

/**
 * Mint Snapshot (온체인 데이터)
 */
export interface MintSnapshot {
    totalWealthUSD: bigint;
    wealthTier: number;
    solBalance: bigint;
    timestamp: bigint;
}

/**
 * Token Info (전체 토큰 정보)
 */
export interface TokenInfo {
    owner: string;
    traits: SkinTraits;
    totalWealthUSD: bigint;
    wealthTier: number;
    specialItem: number;
    mintTimestamp: bigint;
}

/**
 * NFT 메타데이터 (OpenSea 표준)
 */
export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    animation_url?: string;
    attributes: NFTAttribute[];
    properties?: {
        category?: string;
        files?: NFTFile[];
        creators?: NFTCreator[];
    };
}

export interface NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: 'string' | 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

export interface NFTFile {
    uri: string;
    type: string;
}

export interface NFTCreator {
    address: string;
    share: number;
}

/**
 * IPFS 업로드 서명 검증
 */
export interface UploadSignature {
    message: string;
    signature: `0x${string}`;
    address: `0x${string}`;
    timestamp: number;
}

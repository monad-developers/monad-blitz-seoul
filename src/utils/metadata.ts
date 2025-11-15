import { SkinTraits, COLOR_FAMILY_NAMES } from '../lib/traitGenerator';
import {
    NFTMetadata,
    NFTAttribute,
    WEALTH_TIER_NAMES,
    SPECIAL_ITEMS,
    WealthTier,
} from '../types';

/**
 * NFT 메타데이터 생성 (OpenSea 표준)
 *
 * @param tokenId 토큰 ID
 * @param traits 스킨 속성
 * @param wealthTier 자산 등급
 * @param specialItem 특별 아이템 ID
 * @param totalWealthUSD 총 자산 (USD)
 * @param ethValueUSD ETH 가치 (USD)
 * @param usdtValueUSD USDT 가치 (USD)
 * @param usdcValueUSD USDC 가치 (USD)
 * @param gifCID GIF 파일 IPFS CID
 * @param mintTimestamp 민팅 시각 (Unix timestamp)
 * @param contractAddress 컨트랙트 주소
 */
export function generateMetadata(
    tokenId: number,
    traits: SkinTraits,
    wealthTier: WealthTier,
    specialItem: number,
    totalWealthUSD: number,
    ethValueUSD: number,
    usdtValueUSD: number,
    usdcValueUSD: number,
    gifCID: string,
    mintTimestamp: number,
    contractAddress: string
): NFTMetadata {
    const attributes: NFTAttribute[] = [
        // Hat
        { trait_type: 'Hat Style', value: traits.hatStyle },
        { trait_type: 'Hat Color', value: COLOR_FAMILY_NAMES[traits.hatColor as keyof typeof COLOR_FAMILY_NAMES] },
        { trait_type: 'Hat Opacity', value: traits.hatOpacity },

        // Clothes
        { trait_type: 'Clothes Style', value: traits.clothesStyle },
        { trait_type: 'Clothes Color', value: COLOR_FAMILY_NAMES[traits.clothesColor as keyof typeof COLOR_FAMILY_NAMES] },
        { trait_type: 'Clothes Opacity', value: traits.clothesOpacity },

        // Shoes
        { trait_type: 'Shoes Style', value: traits.shoesStyle },
        { trait_type: 'Shoes Color', value: COLOR_FAMILY_NAMES[traits.shoesColor as keyof typeof COLOR_FAMILY_NAMES] },
        { trait_type: 'Shoes Opacity', value: traits.shoesOpacity },

        // Pants
        { trait_type: 'Pants Style', value: traits.pantsStyle },
        { trait_type: 'Pants Color', value: COLOR_FAMILY_NAMES[traits.pantsColor as keyof typeof COLOR_FAMILY_NAMES] },
        { trait_type: 'Pants Opacity', value: traits.pantsOpacity },

        // Skin
        { trait_type: 'Skin Tone', value: traits.skinTone },
        { trait_type: 'Skin Shade', value: traits.skinShade },

        // Wealth
        {
            trait_type: 'Wealth Tier',
            value: WEALTH_TIER_NAMES[wealthTier],
            display_type: 'string',
        },
        {
            trait_type: 'Total Wealth (USD)',
            value: Math.floor(totalWealthUSD),
            display_type: 'number',
        },
        {
            trait_type: 'ETH Value (USD)',
            value: Math.floor(ethValueUSD),
            display_type: 'number',
        },
        {
            trait_type: 'USDT Value (USD)',
            value: Math.floor(usdtValueUSD),
            display_type: 'number',
        },
        {
            trait_type: 'USDC Value (USD)',
            value: Math.floor(usdcValueUSD),
            display_type: 'number',
        },

        // Special Item
        {
            trait_type: 'Special Item',
            value: SPECIAL_ITEMS[specialItem] || 'Unknown',
        },

        // Timestamp
        {
            trait_type: 'Mint Timestamp',
            value: mintTimestamp,
            display_type: 'date',
        },
    ];

    return {
        name: `Minecraft PFP #${tokenId}`,
        description:
            'Dynamic Minecraft-style PFP NFT with wealth-based traits. Generated deterministically from wallet address with special items based on portfolio value at mint time.',
        image: `ipfs://${gifCID}`,
        animation_url: `ipfs://${gifCID}`,
        attributes,
        properties: {
            category: 'pfp',
            files: [
                {
                    uri: `ipfs://${gifCID}`,
                    type: 'image/gif',
                },
            ],
            creators: [
                {
                    address: contractAddress,
                    share: 100,
                },
            ],
        },
    };
}

/**
 * 메타데이터 검증
 */
export function validateMetadata(metadata: NFTMetadata): boolean {
    return !!(
        metadata.name &&
        metadata.description &&
        metadata.image &&
        metadata.attributes &&
        metadata.attributes.length > 0
    );
}

/**
 * 메타데이터를 JSON 문자열로 변환
 */
export function stringifyMetadata(metadata: NFTMetadata): string {
    return JSON.stringify(metadata, null, 2);
}

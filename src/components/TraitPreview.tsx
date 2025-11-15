'use client';

import { SkinTraits, COLOR_FAMILY_NAMES } from '@/lib/traitGenerator';
import { getStyleName } from '@/lib/traitStyles';
import { WEALTH_TIER_NAMES, SPECIAL_ITEMS, WealthTier } from '@/types';

interface TraitPreviewProps {
    traits: SkinTraits;
    wealthTier: WealthTier;
    specialItem: number;
    totalWealthUSD: number;
    ethValueUSD: number;
    usdtValueUSD: number;
    usdcValueUSD: number;
}

export function TraitPreview({
    traits,
    wealthTier,
    specialItem,
    totalWealthUSD,
    ethValueUSD,
    usdtValueUSD,
    usdcValueUSD,
}: TraitPreviewProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-2xl font-bold mb-4">NFT 속성</h2>

            {/* 기본 속성 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">기본 외형</h3>

                <TraitItem
                    label="모자"
                    style={getStyleName('hat', traits.hatStyle)}
                    color={COLOR_FAMILY_NAMES[traits.hatColor]}
                    opacity={traits.hatOpacity}
                />

                <TraitItem
                    label="옷"
                    style={getStyleName('clothes', traits.clothesStyle)}
                    color={COLOR_FAMILY_NAMES[traits.clothesColor]}
                    opacity={traits.clothesOpacity}
                />

                <TraitItem
                    label="신발"
                    style={getStyleName('shoes', traits.shoesStyle)}
                    color={COLOR_FAMILY_NAMES[traits.shoesColor]}
                    opacity={traits.shoesOpacity}
                />

                <TraitItem
                    label="바지"
                    style={getStyleName('pants', traits.pantsStyle)}
                    color={COLOR_FAMILY_NAMES[traits.pantsColor]}
                    opacity={traits.pantsOpacity}
                />

                <TraitItem
                    label="피부톤"
                    style={getStyleName('skin', traits.skinTone)}
                    color={`명암: ${traits.skinShade}`}
                />
            </div>

            {/* Wealth 정보 */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">자산 정보</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Wealth Tier</p>
                        <p className="text-lg font-bold">{WEALTH_TIER_NAMES[wealthTier]}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Special Item</p>
                        <p className="text-lg font-bold">{SPECIAL_ITEMS[specialItem]}</p>
                    </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ETH 가치:</span>
                        <span className="font-semibold">${ethValueUSD.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">USDT 가치:</span>
                        <span className="font-semibold">${usdtValueUSD.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">USDC 가치:</span>
                        <span className="font-semibold">${usdcValueUSD.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span className="font-bold">총 자산:</span>
                        <span className="font-bold text-green-600">${totalWealthUSD.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TraitItem({
    label,
    style,
    color,
    opacity,
}: {
    label: string;
    style: string;
    color: string;
    opacity?: number;
}) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}:</span>
            <div className="text-right">
                <p className="font-semibold">{style}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    {color}
                    {opacity && ` (투명도: ${opacity})`}
                </p>
            </div>
        </div>
    );
}

'use client';

import { SkinTraits, COLOR_FAMILY_NAMES } from '@/lib/traitGenerator';
import { getStyleName } from '@/lib/traitStyles';
import { WEALTH_TIER_NAMES, SPECIAL_ITEMS, WealthTier } from '@/types';
import { MinecraftCard } from './minecraft/MinecraftCard';

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
        <MinecraftCard title="NFT 속성" className="bg-[#8B7355]">
            <div className="space-y-6">
                {/* 기본 속성 */}
                <div className="space-y-4">
                    <h3 className="minecraft-font text-white text-base minecraft-text-shadow border-b-2 border-[#555555] pb-2">
                        기본 외형
                    </h3>

                    <TraitItem
                        label="모자"
                        style={getStyleName('hat', traits.hatStyle)}
                        color={COLOR_FAMILY_NAMES[traits.hatColor as keyof typeof COLOR_FAMILY_NAMES]}
                        opacity={traits.hatOpacity}
                    />

                    <TraitItem
                        label="옷"
                        style={getStyleName('clothes', traits.clothesStyle)}
                        color={COLOR_FAMILY_NAMES[traits.clothesColor as keyof typeof COLOR_FAMILY_NAMES]}
                        opacity={traits.clothesOpacity}
                    />

                    <TraitItem
                        label="신발"
                        style={getStyleName('shoes', traits.shoesStyle)}
                        color={COLOR_FAMILY_NAMES[traits.shoesColor as keyof typeof COLOR_FAMILY_NAMES]}
                        opacity={traits.shoesOpacity}
                    />

                    <TraitItem
                        label="바지"
                        style={getStyleName('pants', traits.pantsStyle)}
                        color={COLOR_FAMILY_NAMES[traits.pantsColor as keyof typeof COLOR_FAMILY_NAMES]}
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
                    <h3 className="minecraft-font text-white text-base minecraft-text-shadow border-b-2 border-[#555555] pb-2">
                        자산 정보
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-3">
                            <p className="minecraft-font text-[#AAAAAA] text-xs">Wealth Tier</p>
                            <p className="minecraft-font text-[#FFD700] text-sm minecraft-text-shadow">{WEALTH_TIER_NAMES[wealthTier]}</p>
                        </div>

                        <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-3">
                            <p className="minecraft-font text-[#AAAAAA] text-xs">Special Item</p>
                            <p className="minecraft-font text-[#55FF55] text-sm minecraft-text-shadow">{SPECIAL_ITEMS[specialItem]}</p>
                        </div>
                    </div>

                    <div className="bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="minecraft-font text-[#AAAAAA] text-xs">ETH:</span>
                            <span className="minecraft-font text-white text-xs">${ethValueUSD.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="minecraft-font text-[#AAAAAA] text-xs">USDT:</span>
                            <span className="minecraft-font text-white text-xs">${usdtValueUSD.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="minecraft-font text-[#AAAAAA] text-xs">USDC:</span>
                            <span className="minecraft-font text-white text-xs">${usdcValueUSD.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t-2 border-[#555555]">
                            <span className="minecraft-font text-white text-sm">총 자산:</span>
                            <span className="minecraft-font text-[#55FF55] text-sm minecraft-text-shadow">${totalWealthUSD.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </MinecraftCard>
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
        <div className="flex justify-between items-center bg-[#8B8B8B] border-2 border-t-[#373737] border-l-[#373737] border-r-[#DFDFDF] border-b-[#DFDFDF] p-2">
            <span className="minecraft-font text-white text-xs">{label}:</span>
            <div className="text-right">
                <p className="minecraft-font text-white text-xs">{style}</p>
                <p className="minecraft-font text-[#AAAAAA] text-[10px]">
                    {color}
                    {opacity && ` (${opacity})`}
                </p>
            </div>
        </div>
    );
}

import type { Address } from "viem";
import { arbitrumSepolia, avalancheFuji, baseSepolia, optimismSepolia, sepolia } from "wagmi/chains";

const supportedChains = [sepolia, arbitrumSepolia, avalancheFuji, baseSepolia, optimismSepolia];

export const nativeSymbolMap: Record<number, string> = supportedChains.reduce<Record<number, string>>((accumulator, chain) => {
  accumulator[chain.id] = chain.nativeCurrency.symbol;
  return accumulator;
}, {});

export const usdcAddressMap: Partial<Record<number, Address>> = {
  [arbitrumSepolia.id]: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
  [avalancheFuji.id]: "0x5425890298aed601595a70AB815c96711a31Bc65",
  [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  [sepolia.id]: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  [optimismSepolia.id]: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
};

"use client";

import { useScaffoldReadContract } from "./scaffold-eth";

export function useMenu(storeAddress: string) {
  return useScaffoldReadContract({
    contractName: "Protocol",
    functionName: "getStoreMenu",
    args: [storeAddress],
  });
}

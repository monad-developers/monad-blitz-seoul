"use client";

import { useScaffoldReadContract } from "./scaffold-eth";

export function useStoreList() {
  return useScaffoldReadContract({
    contractName: "Protocol",
    functionName: "getStores",
  });
}

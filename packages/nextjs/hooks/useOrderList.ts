import { useScaffoldReadContract } from "./scaffold-eth";

export function useOrderList(customerAddress?: string) {
  return useScaffoldReadContract({
    contractName: "Protocol",
    functionName: "orderMap",
    // @ts-ignore
    args: [customerAddress ? BigInt(customerAddress) : BigInt(0)],
  });
}

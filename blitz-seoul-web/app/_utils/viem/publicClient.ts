import { createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export default publicClient;

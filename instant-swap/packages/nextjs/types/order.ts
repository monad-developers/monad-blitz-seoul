export interface SwapOrder {
  maker: string;
  taker: string;
  tokenM: string;
  tokenT: string;
  amountM: bigint;
  amountT: bigint;
  expiry: bigint;
  nonce: bigint;
} 
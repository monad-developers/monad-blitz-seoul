import { createPublicClient, http, PublicClient } from "viem";

const clientCache: Record<string, PublicClient> = {};

interface ClientOptions {
  readonly url: string;
  readonly env?: string;
}

export const getPublicClient = (cacheKey: string, options: ClientOptions) => {
  const resolvedUrl = (options.env ? process.env[options.env] : undefined) ?? options.url;
  if (!resolvedUrl) {
    throw new Error(`RPC URL missing for ${options.env ?? cacheKey}`);
  }
  const key = `${cacheKey}:${resolvedUrl}`;
  if (!clientCache[key]) {
    clientCache[key] = createPublicClient({ transport: http(resolvedUrl) });
  }
  return clientCache[key];
};

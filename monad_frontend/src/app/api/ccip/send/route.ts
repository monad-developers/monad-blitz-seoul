import { NextRequest, NextResponse } from "next/server";
import { chainMap } from "@/config/chains";
import { getPublicClient } from "@/lib/viem";

interface RecipientPayload {
  readonly receiver: string;
  readonly beneficiary: string;
  readonly chainSelector: string;
  readonly assetSymbol: string;
  readonly usdShare: number;
  readonly assetAmount: number;
}

interface DispatchPayload {
  readonly sourceChain?: string;
  readonly totalUsd?: number;
  readonly recipients?: RecipientPayload[];
  readonly chainSummary?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const json = (await request.json().catch(() => null)) as DispatchPayload | null;
  if (!json) {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }
  const recipients = sanitizeRecipients(json.recipients);
  if (recipients.length === 0) {
    return NextResponse.json({ message: "At least one recipient is required" }, { status: 400 });
  }
  const totalUsd = typeof json.totalUsd === "number" && Number.isFinite(json.totalUsd)
    ? json.totalUsd
    : recipients.reduce((accumulator, entry) => accumulator + entry.usdShare, 0);
  const destinationNames = Array.from(
    new Set(
      recipients.map((recipient) => chainMap[recipient.chainSelector]?.name ?? recipient.chainSelector)
    )
  ).join(", ");
  const lane = `${json.sourceChain ?? "Monad"} ⇒ ${destinationNames}`;
  const eta = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const routerDiagnostics = await Promise.all(
    Array.from(new Set(recipients.map((recipient) => recipient.chainSelector))).map(async (selector) => {
      try {
        const chain = chainMap[selector];
        if (!chain) {
          return { selector, router: "", typeAndVersion: "missing-chain" };
        }
        const client = getPublicClient(chain.selector, {
          url: chain.rpcUrl,
          env: chain.rpcEnv,
        });
        const typeAndVersion = await client.readContract({
          address: chain.router as `0x${string}`,
          abi: routerAbi,
          functionName: "typeAndVersion",
        });
        return { selector, router: chain.router, typeAndVersion };
      } catch (error) {
        return { selector, router: chainMap[selector]?.router ?? "", typeAndVersion: "unreachable" };
      }
    })
  );
  const messageId = `0x${crypto.randomUUID().replace(/-/g, "")}`;
  const responsePayload = {
    messageId,
    lane,
    eta,
    totalUsd,
    recipients,
    chainSummary: json.chainSummary ?? [],
    simulatedTxHash: `0x${crypto.randomUUID().replace(/-/g, "")}`,
    routers: routerDiagnostics,
  };
  return NextResponse.json(responsePayload);
}

function sanitizeRecipients(raw: RecipientPayload[] | undefined): RecipientPayload[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => ({
      receiver: typeof entry.receiver === "string" ? entry.receiver : "",
      beneficiary: typeof entry.beneficiary === "string" ? entry.beneficiary : "",
      chainSelector: typeof entry.chainSelector === "string" ? entry.chainSelector : "",
      assetSymbol: typeof entry.assetSymbol === "string" ? entry.assetSymbol : "",
      usdShare: typeof entry.usdShare === "number" && Number.isFinite(entry.usdShare) ? entry.usdShare : 0,
      assetAmount:
        typeof entry.assetAmount === "number" && Number.isFinite(entry.assetAmount) ? entry.assetAmount : 0,
    }))
    .filter((entry) => entry.receiver !== "" && entry.chainSelector !== "" && entry.usdShare > 0);
}

const routerAbi = [
  {
    name: "typeAndVersion",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

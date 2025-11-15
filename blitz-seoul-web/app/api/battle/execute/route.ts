import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
  Address,
  Hex,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { monadTestnet } from "viem/chains";
import { referee } from "@/app/_agents/referee";
import * as z from "zod";
import { monColosseumAbi } from "@/app/_abis/monColosseum";
import { monCharacterAbi } from "@/app/_abis/monCharacter";

const CHARACTER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARACTER_CONTRACT_ADDRESS;
const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
const COLOSSEUM_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_COLOSSEUM_CONTRACT_ADDRESS;

// Game Master의 Private Key (환경 변수에서 읽기)
const GAME_MASTER_PRIVATE_KEY = process.env
  .NEXT_PUBLIC_GAME_MASTER_PRIVATE_KEY as Hex;
if (!GAME_MASTER_PRIVATE_KEY) {
  console.error(
    "WARNING: GAME_MASTER_PRIVATE_KEY is not set. Using placeholder RPC."
  );
}

const gameMasterAccount = privateKeyToAccount(GAME_MASTER_PRIVATE_KEY);

// ----------------- Viem Client 설정 -----------------
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const gameMasterWallet = createWalletClient({
  chain: monadTestnet,
  transport: http(),
  account: gameMasterAccount,
});

// ----------------- ABI 및 타입 정의 -----------------
// 이벤트 ABI 정의
const roundStartedEvent = parseAbiItem(
  "event RoundStarted(uint256 indexed roundId, uint256 colosseumId, bytes32 roundSeed)"
);
const shuffledEvent = parseAbiItem(
  "event Shuffled(uint256 indexed roundId, uint256[] shuffled)"
);

async function fetchNftMetadata(
  tokenId: bigint
): Promise<{ name: string; description: string }> {
  try {
    const uri = await publicClient.readContract({
      address: CHARACTER_CONTRACT_ADDRESS as Address, // 기존에 정의된 CHARACTER 주소
      abi: monCharacterAbi,
      functionName: "tokenURI",
      args: [tokenId],
    });

    const response = await fetch(String(uri));
    if (!response.ok) {
      console.error(
        `Failed to fetch metadata from ${uri}: ${response.statusText}`
      );
      return {
        name: `NFT-${tokenId.toString()}`,
        description: "메타데이터 로드 실패.",
      };
    }

    const metadata = await response.json();

    const description =
      metadata.description ||
      metadata.prompt ||
      `NFT ID ${tokenId}의 기본 설명.`;

    return {
      name: metadata.name || `NFT-${tokenId.toString()}`,
      description: description,
    };
  } catch (error) {
    console.error(`Error fetching metadata for tokenId ${tokenId}:`, error);
    return {
      name: `NFT-${tokenId.toString()}`,
      description: "메타데이터 조회 중 오류 발생.",
    };
  }
}

// ----------------- API 라우트 핸들러 -----------------
export async function POST(request: NextRequest) {
  if (!GAME_MASTER_PRIVATE_KEY) {
    return NextResponse.json(
      {
        message:
          "서버에 GAME_MASTER_PRIVATE_KEY가 설정되지 않아 트랜잭션을 실행할 수 없습니다.",
      },
      { status: 500 }
    );
  }

  const colosseumIdSchema = z.object({
    colosseumId: z
      .string()
      .refine(
        (val) => !isNaN(parseInt(val)),
        "Colosseum ID는 숫자여야 합니다."
      ),
  });

  const body = await request.json();
  const { colosseumId: colosseumIdStr } = colosseumIdSchema.parse(body);
  const colosseumId = BigInt(colosseumIdStr);

  let txHash;
  let roundId: bigint | undefined;
  let shuffledNFTs: bigint[] = [];

  //   // ----------------------------------------------------
  //   // Step 1: triggerRound 트랜잭션 전송 및 대기
  //   // ----------------------------------------------------
  console.log(
    `[Full Execute] Colosseum ${colosseumIdStr}에 대해 triggerRound 시뮬레이션 시작...`
  );

  txHash = await gameMasterWallet.writeContract({
    address: COLOSSEUM_CONTRACT_ADDRESS as Address,
    abi: monColosseumAbi,
    functionName: "triggerRound",
    args: [colosseumId],
  });
  console.log(`[Full Execute] triggerRound 트랜잭션 전송됨: ${txHash}`);

  // 트랜잭션이 블록에 포함될 때까지 대기
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash as Address,
  });
  const blockNumber = receipt.blockNumber;
  console.log(
    `[Full Execute] triggerRound 트랜잭션 확정됨. 블록: ${blockNumber}`
  );

  // ----------------------------------------------------
  // Step 2: Round ID 및 Shuffled NFT 목록 가져오기 (이벤트 로그 기반)
  // ----------------------------------------------------

  // RoundStarted 이벤트 로그 검색
  const roundStartedLogs = await publicClient.getLogs({
    address: COLOSSEUM_CONTRACT_ADDRESS as Address,
    event: roundStartedEvent,
    args: {},
    fromBlock: blockNumber,
    toBlock: blockNumber,
  });

  const latestRoundLog = roundStartedLogs[roundStartedLogs.length - 1];
  roundId = latestRoundLog?.args?.roundId as bigint;

  if (!roundId) {
    throw new Error(
      "RoundStarted 이벤트를 찾을 수 없습니다. triggerRound에 실패했거나 로그가 생성되지 않았습니다."
    );
  }

  console.log("✅", roundId);

  const shuffledLogs = await publicClient.getLogs({
    address: COLOSSEUM_CONTRACT_ADDRESS as Address,
    event: shuffledEvent,
    args: {
      roundId: roundId,
    },
    fromBlock: blockNumber,
    toBlock: blockNumber,
  });

  const latestShuffledLog = shuffledLogs[shuffledLogs.length - 1];
  shuffledNFTs = latestShuffledLog?.args?.shuffled as bigint[];

  console.log("✅", shuffledNFTs);

  // if (
  //   !shuffledNFTs ||
  //   shuffledNFTs.length === 0 ||
  //   shuffledNFTs.length % 2 !== 0
  // ) {
  //   throw new Error(
  //     `셔플된 NFT 수가 유효하지 않습니다: ${shuffledNFTs?.length}. 최소 2명 이상이어야 합니다.`
  //   );
  // }

  console.log(
    `[Full Execute] 라운드 ID ${roundId}, 셔플된 NFT 갯수: ${shuffledNFTs.length}개 셔플된 NFT: ${shuffledNFTs}`
  );

  // // ----------------------------------------------------
  // // Step 3: AI 매칭 및 결과 생성
  // // ----------------------------------------------------

  const winners: bigint[] = [];
  const losers: bigint[] = [];
  const battleRecords = [];
  const totalBattles = shuffledNFTs.length / 2;

  for (let i = 0; i < totalBattles; i++) {
    const playerAId = shuffledNFTs[i * 2];
    const playerBId = shuffledNFTs[i * 2 + 1];

    // NFT 메타데이터 가져오기
    const [metaA, metaB] = await Promise.all([
      fetchNftMetadata(playerAId),
      fetchNftMetadata(playerBId),
    ]);

    // AI 판정 (referee 호출)
    const result = await referee(
      metaA.name,
      metaA.description,
      metaB.name,
      metaB.description
    );

    let winnerId: bigint;
    let loserId: bigint;

    console.log(result);
    if (result.winner === metaA.name) {
      winnerId = playerAId;
      loserId = playerBId;
    } else if (result.winner === metaB.name) {
      winnerId = playerBId;
      loserId = playerAId;
    } else {
      console.warn(
        `AI 판정 실패: 예상된 승자 (${metaA.name} or ${metaB.name})와 다름. 기본적으로 A를 승자로 처리합니다.`
      );
      winnerId = playerAId;
      loserId = playerBId;
    }

    winners.push(winnerId);
    losers.push(loserId);

    battleRecords.push({
      match: [`${metaA.name} (${playerAId})`, `${metaB.name} (${playerBId})`],
      winner: winnerId.toString(),
      loser: loserId.toString(),
      scenario: result.scenario,
    });
  }

  // ----------------------------------------------------
  // Step 4: submitBattleResults 트랜잭션 제출 (Game Master 권한)
  // ----------------------------------------------------

  const submitTxHash = await gameMasterWallet.writeContract({
    address: COLOSSEUM_CONTRACT_ADDRESS as Address,
    abi: monColosseumAbi,
    functionName: "submitBattleResults",
    args: [colosseumId, roundId, winners, losers],
  });

  // // ----------------------------------------------------
  // // Step 5: 최종 결과 반환
  // // ----------------------------------------------------
  return NextResponse.json(
    {
      success: true,
      message: `[SUCCESS] 라운드 시작 및 ${totalBattles}개의 전투 결과 제출이 성공적으로 완료되었습니다.`,
      colosseumId: colosseumIdStr,
      roundId: roundId.toString(),
      triggerRoundTxHash: txHash,
      submitBattleResultsTxHash: submitTxHash,
      battles: battleRecords,
    },
    { status: 200 }
  );
}

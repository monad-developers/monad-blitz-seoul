"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import {
  Address,
  ContractFunctionExecutionError,
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
  formatEther,
} from "viem";
import { monadTestnet } from "viem/chains";
import { monCharacterAbi } from "../_abis/monCharacter";
import { monCharacterVaultAbi } from "../_abis/monCharacterVault";
import { monColosseumAbi } from "../_abis/monColosseum";

const CHARACTER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARACTER_CONTRACT_ADDRESS;
const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
const COLOSSEUM_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_COLOSSEUM_CONTRACT_ADDRESS;

export default function Admin() {
  const [colosseumId, setColosseumId] = useState("");
  const { wallets } = useWallets();
  const [trigger, setTrigger] = useState(false);
  const [colosseumNfts, setColosseumNfts] = useState<string[]>([]);
  const [colosseumNftsLoading, setColosseumNftsLoading] = useState(false);
  const [colosseumNftsError, setColosseumNftsError] = useState<string | null>(
    null
  );
  const [buyIn, setBuyIn] = useState("");
  const { sendTransaction } = useSendTransaction();
  const isWalletConnected = wallets.length > 0;
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const fetchColosseumNfts = async (colosseumId: string) => {
    if (!colosseumId) {
      alert("Insert Colosseum ID");
      return;
    }

    try {
      setColosseumNftsLoading(true);
      setColosseumNftsError(null);

      const nfts = await publicClient.readContract({
        address: COLOSSEUM_CONTRACT_ADDRESS as Address,
        abi: [
          {
            type: "function",
            name: "getActiveNFTs",
            inputs: [
              { name: "colosseumId", type: "uint256", internalType: "uint256" },
            ],
            outputs: [
              { name: "", type: "uint256[]", internalType: "uint256[]" },
            ],
            stateMutability: "view",
          },
        ],
        functionName: "getActiveNFTs",
        args: [BigInt(colosseumId)],
      });

      // nfts: bigint[]
      const nftIdsAsString = (nfts as bigint[]).map((id) => id.toString());
      setColosseumNfts(nftIdsAsString);
    } catch (error) {
      console.error("getActiveNFTs error:", error);
      setColosseumNftsError("fail NFT list.");
    } finally {
      setColosseumNftsLoading(false);
    }
  };

  const handleSetGameMaster = async () => {
    const gameMasterAddress = wallets[0]?.address;
    if (!gameMasterAddress) {
      alert("지갑이 연결되어 있어야 합니다.");
      return;
    }

    // setGameMaster 함수 인코딩
    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "setGameMaster",
          inputs: [
            { name: "_gameMaster", type: "address", internalType: "address" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "setGameMaster",
      args: [gameMasterAddress as Address], // 연결된 지갑 주소
    });

    try {
      await sendTransaction(
        {
          to: COLOSSEUM_CONTRACT_ADDRESS,
          data,
        },
        {
          address: wallets[0].address,
        }
      );

      alert(
        `Game Master를 ${gameMasterAddress}로 설정하는 트랜잭션이 전송되었습니다!`
      );
    } catch (error) {
      console.error("setGameMaster tx error:", error);
      alert("Game Master 설정 트랜잭션 실패 (Owner만 가능)");
    }
  };

  const handleCreateColosseum = async (buyIn: string) => {
    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "createNewColosseum",
          inputs: [{ name: "buyIn", type: "uint256", internalType: "uint256" }],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "createNewColosseum",
      args: [parseEther(buyIn)], // ETH 단위 입력
    });

    await sendTransaction(
      {
        to: COLOSSEUM_CONTRACT_ADDRESS,
        data,
      },
      {
        address: wallets[0].address,
      }
    );

    alert("createNewColosseum tx sent!");
  };

  return (
    <div className="absolute flex w-full gap-5">
      <div className="bg-white flex flex-col px-4 py-4">
        <h2 className="mt-4  font-bold">🚨 Set Game Master</h2>
        <p className="text-sm text-gray-300">
          (Owner만 호출 가능) 현재 연결된 지갑을 Game Master로 설정합니다.
        </p>

        <button
          style={{ backgroundColor: "darkgoldenrod", marginTop: 8 }}
          onClick={handleSetGameMaster}
          disabled={!isWalletConnected}
        >
          Set ME as Game Master ({wallets[0]?.address.substring(0, 6)}...)
        </button>

        <h2 className="mt-4  font-bold">🏟️ Create New Colosseum</h2>

        <p>Set Colosseum Id</p>
        <input
          value={colosseumId}
          onChange={(e) => setColosseumId(e.target.value)}
          placeholder="Colosseum ID (uint256)"
          className="border px-2 py-1"
        />
        <p>Set Colosseum BuyIn</p>
        <input
          value={buyIn}
          onChange={(e) => setBuyIn(e.target.value)}
          placeholder="Enter buy-in amount (ETH)"
          className="border px-2 py-1"
        />

        <button
          style={{
            backgroundColor: "purple",
          }}
          onClick={() => handleCreateColosseum(buyIn || "")}
          disabled={!isWalletConnected}
        >
          Create New Colosseum
        </button>

        <h2 className="mt-4  font-bold">📋 Colosseum NFT List</h2>
        <button
          style={{ backgroundColor: "orange" }}
          onClick={() => fetchColosseumNfts(colosseumId || "")}
        >
          Load NFTs in Colosseum
        </button>

        {colosseumNftsLoading && (
          <div style={{ color: "white" }}>Loading NFTs...</div>
        )}

        {colosseumNftsError && (
          <div style={{ color: "red" }}>{colosseumNftsError}</div>
        )}

        {!colosseumNftsLoading &&
          !colosseumNftsError &&
          colosseumNfts.length > 0 && (
            <ul style={{ color: "black", marginTop: 8 }}>
              {colosseumNfts.map((id) => (
                <li key={id}>NFT ID: {id}</li>
              ))}
            </ul>
          )}

        {!colosseumNftsLoading &&
          !colosseumNftsError &&
          colosseumNfts.length === 0 && (
            <div style={{ color: "gray", marginTop: 8 }}>
              아직 불러온 NFT가 없거나, 콜로세움이 비어있습니다.
            </div>
          )}
      </div>
    </div>
  );
}

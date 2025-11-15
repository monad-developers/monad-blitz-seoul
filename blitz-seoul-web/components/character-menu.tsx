"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { useWallets } from "@privy-io/react-auth";
import { Address, createPublicClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import publicClient from "@/app/_utils/viem/publicClient";

const CHARACTER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARACTER_CONTRACT_ADDRESS;

export function CharacterMenu() {
  const router = useRouter();
  const { wallets } = useWallets();

  const fetchTokenId = async (owner: Address) => {
    const result = await publicClient.readContract({
      address: CHARACTER_CONTRACT_ADDRESS as `0x${string}`,
      abi: [
        {
          type: "function",
          name: "tokenIdOf",
          inputs: [{ name: "owner", type: "address", internalType: "address" }],
          outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
          stateMutability: "view",
        },
      ],
      functionName: "tokenIdOf",
      args: [owner],
    });

    console.log("tokenId:", result);

    return result;
  };

  const handleStarClick = async () => {
    console.log(
      `[v0] Clicked star: ${wallets[0]?.address}, ${wallets[1]?.address}, ${wallets[2]}, ${wallets[3]}`
    );
    const address = wallets[0]?.address;
    if (address) {
      const nftId = await fetchTokenId(address as Address);
      if (0 < nftId) {
        router.push("/my-page");
      } else {
        router.push("/create-character");
      }
    } else {
      console.log("Owner address is missing or invalid.");
      alert("지갑 연결을 해주세요");
    }
  };

  return (
    <div
      onClick={handleStarClick}
      className="absolute"
      style={{
        top: "38.5%",
        left: "48.5%",
        zIndex: 20,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Star Image - non-interactive */}
      <div className="relative w-[640px] h-[640px] pointer-events-none">
        <Image
          src="star-character.png"
          alt="Star Character"
          width={640}
          height={640}
          className="drop-shadow-lg"
        />
      </div>

      {/* Click text - position 1 (upper center area) */}
      <motion.div
        className="absolute text-yellow-300 font-bold text-4xl cursor-pointer"
        style={{
          top: "35%",
          left: "48%",
          fontFamily: "'NanumKarGugSu', cursive",
          textShadow: "0 0 10px rgba(255, 255, 0, 0.8)",
        }}
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        Click
      </motion.div>

      {/* Click text - position 2 (left center area) */}
      <motion.div
        className="absolute text-yellow-300 font-bold text-4xl cursor-pointer"
        style={{
          top: "50%",
          left: "29%",
          fontFamily: "'NanumKarGugSu', cursive",
          textShadow: "0 0 10px rgba(255, 255, 0, 0.8)",
        }}
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        Click
      </motion.div>

      {/* Click text - position 3 (right center area) */}
      <motion.div
        className="absolute text-yellow-300 font-bold text-4xl cursor-pointer"
        style={{
          top: "52%",
          left: "65%",
          fontFamily: "'NanumKarGugSu', cursive",
          textShadow: "0 0 10px rgba(255, 255, 0, 0.8)",
        }}
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        Click
      </motion.div>
    </div>
  );
}

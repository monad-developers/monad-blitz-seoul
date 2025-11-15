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

export default function MyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { wallets } = useWallets();
  const [isExecuting, setIsExecuting] = useState(false);
  const [trigger, setTrigger] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("판돈 선택");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTab, setVaultTab] = useState<"deposite" | "withdraw">("deposite");
  const [amount, setAmount] = useState("");
  const [showBattleHistory, setShowBattleHistory] = useState(false);
  const [isPNLShareOpen, setIsPNLShareOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [tokenId, setTokenId] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [characterImgUrl, setCharacterImgUrl] = useState(
    "/star-character-prev.png"
  );
  const { sendTransaction } = useSendTransaction();
  const [vaultBalance, setVaultBalance] = useState(0);
  const [res, setRes] = useState<any>(null);

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const address = wallets[0]?.address;
    async function fetchAndSetMetadata() {
      if (typeof address === "string" && address.startsWith("0x")) {
        const tokenId = await fetchTokenId(address as `0x${string}`);
        fetchNftMetadata(tokenId);
      }
    }
    fetchAndSetMetadata();
  }, [wallets]);

  useEffect(() => {
    const address = wallets[0]?.address;
    async function fetchAndSetVaultBalance() {
      if (typeof address === "string" && address.startsWith("0x")) {
        const balance = await fetchBalance();
        setVaultBalance(Number(balance));
      }
    }
    fetchAndSetVaultBalance();
  }, [wallets, trigger]);

  async function fetchNftMetadata(
    tokenId: bigint
  ): Promise<{ name: string; description: string; imgUrl: string }> {
    try {
      const uri = (await publicClient.readContract({
        address: CHARACTER_CONTRACT_ADDRESS as Address,
        abi: monCharacterAbi,
        functionName: "tokenURI",
        args: [tokenId],
      })) as string;

      const fetchUrl = uri;

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        console.error(
          `Failed to fetch metadata from ${fetchUrl}: ${response.statusText}`
        );
        return {
          name: `NFT-${tokenId.toString()}`,
          description: "메타데이터 로드 실패.",
          imgUrl: "메타데이터 로드 실패.",
        };
      }

      const metadata = await response.json();

      const description =
        metadata.description ||
        metadata.prompt ||
        `NFT ID ${tokenId}의 기본 설명.`;
      console.log("✅", metadata);
      console.log("✅", metadata.name);
      console.log(description);
      console.log(metadata.imgUrl);

      setCharacterName(metadata.name);
      setCharacterPrompt(description);
      setCharacterImgUrl(metadata.imgUrl);
      return {
        name: metadata.name || `NFT-${tokenId.toString()}`,
        description: description,
        imgUrl: metadata.imgUrl,
      };
    } catch (error) {
      console.error(`Error fetching metadata for tokenId ${tokenId}:`, error);

      return {
        name: `NFT-${tokenId.toString()}`,
        description: "메타데이터 조회 중 오류 발생.",
        imgUrl: "메타데이터 조회 중 오류 발생.",
      };
    }
  }

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
    setTokenId(String(result));

    return result;
  };

  const handleDeposit = async (deposit: string) => {
    const data = encodeFunctionData({
      abi: monCharacterVaultAbi,
      functionName: "deposit",
      args: [],
    });

    await sendTransaction(
      {
        to: VAULT_CONTRACT_ADDRESS,
        data,
        value: parseEther(deposit),
      },
      {
        address: wallets[0].address,
      }
    );

    setTrigger(!trigger);

    alert("deposit tx sent!");
  };

  const handleWithdraw = async (withdraw: string) => {
    console.log(withdraw);
    const data = encodeFunctionData({
      abi: monCharacterVaultAbi,
      functionName: "withdraw",
      args: [parseEther(withdraw)],
    });

    await sendTransaction(
      {
        to: VAULT_CONTRACT_ADDRESS,
        data,
      },
      {
        address: wallets[0].address,
      }
    );
    setTrigger(!trigger);

    alert("withdraw tx sent!");
  };

  const fetchBalance = async () => {
    try {
      let balance = await publicClient.readContract({
        address: VAULT_CONTRACT_ADDRESS as Address,
        abi: monCharacterVaultAbi,
        functionName: "balanceOf",
        args: [wallets[0]?.address],
      });

      console.log("balance:", balance);

      setVaultBalance(Number(balance));

      return formatEther(balance as bigint);
    } catch (error) {
      if (error instanceof ContractFunctionExecutionError) {
        console.error("require err", error.message);
      } else {
        console.error("something error:", error);
      }
    }
  };

  const handleExecuteRoundAndSubmit = async () => {
    if (selectedAmount === "판돈 선택") {
      alert("먼저 판돈을 입력하세요.");
      return;
    }
    if (!wallets.length) {
      alert("지갑이 연결되어 있어야 합니다.");
      return;
    }

    let colosseumId;

    switch (selectedAmount) {
      case "1mon":
        colosseumId = "1";
        break;
      case "10mon":
        colosseumId = "2";
        break;
      case "100mon":
        colosseumId = "3";
        break;
      default:
        colosseumId = "1";
    }

    setIsExecuting(true);
    setRes(null);

    try {
      const response = await fetch("api/battle/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colosseumId: colosseumId }),
      });

      const data = await response.json();
      setRes(data);

      if (!response.ok) {
        alert(`❌ Full Execution Failed: ${data.message || "Unknown error"}`);
      } else {
        alert("✅ Full Round Execution and Submission Success!");
      }
    } catch (e) {
      console.error("Client side fetch error:", e);
      setRes({
        success: false,
        message: "클라이언트에서 API 호출 중 네트워크 오류 발생",
        error: e instanceof Error ? e.message : String(e),
      });
      alert("API 호출 중 네트워크 오류 발생.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEnterColosseum = async () => {
    if (!tokenId) {
      alert("require nftId");
      return;
    }

    let colosseumId;

    switch (selectedAmount) {
      case "1mon":
        colosseumId = "1";
        break;
      case "10mon":
        colosseumId = "2";
        break;
      case "100mon":
        colosseumId = "3";
        break;
      default:
        colosseumId = "1";
    }
    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "enterColosseum",
          inputs: [
            { name: "nftId", type: "uint256", internalType: "uint256" },
            { name: "colosseumId", type: "uint256", internalType: "uint256" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "enterColosseum",
      args: [BigInt(tokenId), BigInt(colosseumId)],
    });

    await sendTransaction(
      { to: COLOSSEUM_CONTRACT_ADDRESS, data },
      { address: wallets[0].address }
    );

    alert("enterColosseum tx sent!");
  };

  const handleExitColosseum = async () => {
    if (!tokenId) {
      alert("require nftId");
      return;
    }

    let colosseumId;

    switch (selectedAmount) {
      case "1mon":
        colosseumId = "1";
        break;
      case "10mon":
        colosseumId = "2";
        break;
      case "100mon":
        colosseumId = "3";
        break;
      default:
        colosseumId = "1";
    }

    const data = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "exitColosseum",
          inputs: [
            { name: "nftId", type: "uint256", internalType: "uint256" },
            { name: "colosseumId", type: "uint256", internalType: "uint256" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "exitColosseum",
      args: [BigInt(tokenId), BigInt(colosseumId)],
    });

    await sendTransaction(
      { to: COLOSSEUM_CONTRACT_ADDRESS, data },
      { address: wallets[0].address }
    );

    alert("exitColosseum tx sent!");
  };

  if (showBattleHistory) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: "url(/monstar-arcade.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-5xl w-full bg-white relative"
        >
          <button
            onClick={() => setShowBattleHistory(false)}
            className="flex items-center gap-2 mb-6 text-purple-600 hover:text-purple-700"
            style={{ fontFamily: "'NanumKarGugSu', cursive" }}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-lg font-bold">돌아가기</span>
          </button>

          <div className="flex justify-end items-center gap-3 mb-6 mr-4">
            <button
              className="px-6 py-2 rounded-lg font-bold text-white shadow-md hover:shadow-lg"
              style={{
                background: "#9b6dd6",
                fontFamily: "'NanumKarGugSu', cursive",
              }}
              onClick={handleExecuteRoundAndSubmit}
              disabled={isExecuting}
            >
              🚀 Execute Full Round & Submit
            </button>
            <div
              className="flex items-center gap-3 "
              style={{ fontFamily: "'NanumKarGugSu', cursive" }}
            >
              <p className="text-xl font-bold text-gray-500 ">
                Character Balance
              </p>
              <p className="text-2xl font-bold text-black">
                {" "}
                {vaultBalance} mon
              </p>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {!res || !res.battles?.length ? (
              <div
                className="text-center text-gray-500 text-4xl py-10"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                결과가 없습니다.
              </div>
            ) : (
              res.battles.map((battle: any, idx: number) => (
                <div
                  key={idx}
                  className={`bg-white border-2 rounded-xl p-6 ${
                    tokenId == battle.winner || tokenId == battle.loser
                      ? "border-gray-600"
                      : "border-gray-200"
                  }`}
                >
                  <div
                    className="grid grid-cols-3 gap-4 mb-4 text-center font-bold text-2xl"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    <p className="text-center text-2xl mb-4 font-bold text-blue-500">
                      🏆 {battle.match[0]} 🏆
                    </p>
                    <div>VS</div>
                    <p className="text-center text-2xl mb-4 font-bold text-red-500">
                      💀 {battle.match[1]} 💀
                    </p>
                  </div>

                  <div
                    className="text-center text-lg mb-4 font-bold text-black"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {battle.scenario}
                  </div>

                  <div className="flex text-lg font-bold text-gray-600 gap-2">
                    <p
                      className="text-m font-bold text-blue-500"
                      style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                    >
                      RoundTx:
                    </p>

                    <p
                      className="text-m font-bold text-gray-500"
                      style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                    >
                      {res.triggerRoundTxHash}
                    </p>
                  </div>

                  <div className="flex text-lg font-bold text-gray-600 gap-2">
                    <p
                      className="text-m font-bold text-blue-500"
                      style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                    >
                      submitBattleResultsTxHash:
                    </p>

                    <p
                      className="text-m font-bold text-gray-500"
                      style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                    >
                      {res.submitBattleResultsTxHash}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/monstar-arcade.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-5xl w-full bg-white relative"
      >
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 text-purple-600 hover:text-purple-700 transition-colors"
          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
        >
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex justify-end items-center gap-6 mb-6">
          <div
            className="flex items-center gap-3"
            style={{ fontFamily: "'NanumKarGugSu', cursive" }}
          >
            <p className="text-xl font-bold text-gray-500">Character Balance</p>
            <p className="text-2xl font-bold text-black"> {vaultBalance} mon</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setIsVaultOpen(true)}
              className="px-6 py-2 rounded-lg font-bold text-white shadow-md hover:shadow-lg"
              style={{
                background: "#9b6dd6",
                fontFamily: "'NanumKarGugSu', cursive",
              }}
            >
              My Vault
            </button>
            <div className="relative">
              <button
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className="px-6 py-2 rounded-lg font-bold text-black shadow-md hover:shadow-lg bg-transparent border-2 border-gray-400"
                style={{
                  fontFamily: "'NanumKarGugSu', cursive",
                }}
              >
                {wallets[0]?.address}
              </button>
              {isWalletDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-lg border-2 border-gray-300 z-10 min-w-[200px]"
                >
                  <button
                    onClick={() => {
                      setIsWalletDropdownOpen(false);
                      router.push("/");
                    }}
                    className="w-full py-3 px-4 text-left font-bold text-lg text-red-600 hover:bg-red-50 rounded-xl"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    Disconnect
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Character image */}
          <div className="flex items-center justify-center">
            <img
              src={characterImgUrl}
              alt="캐릭터 이미지"
              className="w-full aspect-square rounded-2xl"
            />
          </div>

          {/* Character info and buttons */}
          <div className="flex flex-col justify-between">
            {/* Info section */}
            <div>
              <h3
                className="text-xl font-black text-gray-500 mb-1"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                이름
              </h3>
              <p
                className="text-3xl font-bold text-black mb-4"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                {characterName}
              </p>

              <h3
                className="text-xl font-black text-gray-500 mb-1 "
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                프롬프트 (설명)
              </h3>
              <p
                className="text-lg font-bold text-black mb-4"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                {characterPrompt}
              </p>

              <div className="bg-gray-100 rounded-xl p-6 border-2 border-gray-300 space-y-4">
                <div className="flex justify-between">
                  <div
                    className="text-2xl font-bold text-gray-500"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {selectedAmount} 콜로세움 참여중...
                  </div>
                  <button
                    onClick={handleExitColosseum}
                    className="px-2 py-0.5 rounded-lg font-bold text-sm border-2 text-red-400 bg-red-200 hover:bg-red-300 hover:text-red-800"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {selectedAmount} 콜로세움에서 도망치기 🏃💨
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-black"
                    style={{
                      fontSize: "25px",
                      fontFamily: "'NanumKarGugSu', cursive",
                    }}
                  >
                    전적
                  </span>
                  <button
                    onClick={() => setShowBattleHistory(true)}
                    className="px-2 py-0.5 rounded-lg font-bold text-sm border-2 border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    MORE
                  </button>
                </div>

                {/* <div
                  className="text-base font-bold text-black"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  경기수 13 승리 10 패배 2 무승부 1
                </div> */}

                <div className="flex items-center gap-2">
                  <span
                    className="text-base font-bold text-black"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    PNL 공유하기
                  </span>
                  <button
                    onClick={() => setIsPNLShareOpen(true)}
                    className="px-2 py-0.5 rounded-lg font-bold text-sm border-2 border-purple-600 text-purple-600 bg-transparent hover:bg-purple-50"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    share
                  </button>
                </div>
              </div>
            </div>

            {/* Buttons section */}
            <div className="flex gap-4 pt-4">
              <div className="flex-1 relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full py-3 rounded-xl font-bold text-lg text-white"
                  style={{
                    background: "#9b6dd6",
                    fontFamily: "'NanumKarGugSu', cursive",
                  }}
                >
                  콜로세움 {selectedAmount}
                </motion.button>

                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border-2 border-gray-300 z-10"
                  >
                    {["1mon"].map((amt) => (
                      // {["1mon", "10mon", "100mon"].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleAmountSelect(amt)}
                        className="w-full py-3 px-4 text-left font-bold text-lg text-black hover:bg-purple-100 rounded-xl"
                        style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                      >
                        {amt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <motion.button
                onClick={handleEnterColosseum}
                whileHover={{ scale: 1.05 }}
                className="flex-1 py-3 rounded-xl font-bold text-lg text-white"
                style={{
                  background:
                    selectedAmount === "판돈 선택" ? "gray" : "#2090c6",
                  fontFamily: "'NanumKarGugSu', cursive",
                }}
                disabled={selectedAmount == "판돈 선택"}
              >
                {selectedAmount === "판돈 선택" ? (
                  "👈 판돈을 설정해주세요"
                ) : (
                  <>⚔️ {selectedAmount} 투기장 이동 ⚔️</>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isVaultOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setIsVaultOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-3xl p-8 max-w-md w-full shadow-2xl bg-white"
              >
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setVaultTab("deposite")}
                    className="text-xl font-bold"
                    style={{
                      fontFamily: "'NanumKarGugSu', cursive",
                      color: vaultTab === "deposite" ? "#ef4444" : "#000000",
                    }}
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setVaultTab("withdraw")}
                    className="text-xl font-bold"
                    style={{
                      fontFamily: "'NanumKarGugSu', cursive",
                      color: vaultTab === "withdraw" ? "#ef4444" : "#000000",
                    }}
                  >
                    Withdraw
                  </button>
                </div>

                <div className="mb-4">
                  <h3
                    className="text-lg font-bold text-black mb-2"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    Connected wallet
                  </h3>
                  <p
                    className="text-sm font-bold text-black"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {wallets[0]?.address}
                  </p>
                </div>

                <div className="mb-6">
                  <h3
                    className="text-lg font-bold text-black mb-2"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    Amount{" "}
                    <span className="text-red-600">
                      (Wallet Balance : {vaultBalance} mon)
                    </span>
                  </h3>
                  <div className="bg-white rounded-lg p-3 border-2 border-gray-300">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="금액을 입력하세요"
                      className="w-full text-2xl font-bold text-black outline-none"
                      style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                    />
                    <div
                      className="text-sm font-bold text-black mt-1"
                      style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                    >
                      MON
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsVaultOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-lg border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors bg-transparent"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      vaultTab === "withdraw"
                        ? handleWithdraw(amount || "")
                        : handleDeposit(amount || "")
                    }
                    // onClick={() => setIsVaultOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-lg border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors bg-transparent"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPNLShareOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setIsPNLShareOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-3xl p-8 max-w-2xl w-full shadow-2xl bg-white"
              >
                <button
                  onClick={() => setIsPNLShareOpen(false)}
                  className="flex items-center gap-2 mb-6 text-purple-600 hover:text-purple-700"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="text-lg font-bold">돌아가기</span>
                </button>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-center">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pnl%20%ED%99%94%EB%A9%B4-AVg0a2NINJBKFC9MwdB0GeFphilYfA.jpg"
                      alt="PNL Character"
                      className="w-full h-auto rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="space-y-4">
                      <h2
                        className="text-2xl font-bold text-left mb-6"
                        style={{
                          color: "#9b6dd6",
                          fontFamily: "'NanumKarGugSu', cursive",
                        }}
                      >
                        당신은 Winner 인가요 Loser 인가요?
                      </h2>

                      <div>
                        <h3
                          className="text-xl font-bold text-black mb-2"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          이름
                        </h3>
                        <p
                          className="text-lg text-black"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          {characterName}
                        </p>
                      </div>

                      <div>
                        <h3
                          className="text-xl font-bold text-black mb-2"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          프롬프트 (설명)
                        </h3>
                        <p
                          className="text-lg text-black"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          {characterPrompt}
                        </p>
                      </div>

                      <div>
                        <h3
                          className="text-xl font-bold text-black mb-2"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          승리수
                        </h3>
                        <p
                          className="text-lg text-black"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          10
                        </p>
                      </div>

                      <div>
                        <h3
                          className="text-xl font-bold text-black mb-2"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          패배수
                        </h3>
                        <p
                          className="text-lg text-black"
                          style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                        >
                          2
                        </p>
                      </div>

                      <p
                        className="text-2xl font-bold text-center"
                        style={{
                          color: "#ff6b35",
                          fontFamily: "'NanumKarGugSu', cursive",
                        }}
                      >
                        당신은 승리의 여신!
                      </p>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button
                        className="flex-1 py-3 rounded-xl font-bold text-lg text-white hover:opacity-90"
                        style={{
                          background: "#9b6dd6",
                          fontFamily: "'NanumKarGugSu', cursive",
                        }}
                      >
                        Save
                      </button>
                      <button
                        className="flex-1 py-3 rounded-xl font-bold text-lg text-white hover:opacity-90"
                        style={{
                          background: "#9b6dd6",
                          fontFamily: "'NanumKarGugSu', cursive",
                        }}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

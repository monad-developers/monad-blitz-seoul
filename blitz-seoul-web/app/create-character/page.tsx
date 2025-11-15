"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import { monCharacterAbi } from "../_abis/monCharacter";
import { encodeFunctionData } from "viem";
import { uploadJson, uploadImage } from "../_utils/r2/uploads";
import generateImage from "../_utils/nano/generateImg";

const CHARACTER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHARACTER_CONTRACT_ADDRESS;
const VAULT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS;
const COLOSSEUM_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_COLOSSEUM_CONTRACT_ADDRESS;

export default function CreateCharacter() {
  const { wallets } = useWallets();
  const router = useRouter();
  const [characterName, setCharacterName] = useState("");
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [isSettingDone, setSettingDone] = useState(false);
  const [stepNum, setStepNum] = useState(0);
  const createdDate = new Date().toLocaleDateString("ko-KR");
  const { sendTransaction } = useSendTransaction();
  const isWalletConnected = wallets.length > 0;

  const handleCreate = async () => {
    const imgBuffer = await generateImage(characterPrompt);
    setImgUrl(await uploadImage(imgBuffer, characterName));
    console.log("[v0] Creating character:", { characterName, characterPrompt });

    if (isSettingDone) {
      setStepNum(1);
    }
  };

  const handleMint = async () => {
    const metadata = {
      name: characterName,
      prompt: characterPrompt,
      imgUrl,
    };

    const metadataUrl = await uploadJson(metadata, characterName);

    const data = encodeFunctionData({
      abi: monCharacterAbi,
      functionName: "mint",
      args: [metadataUrl],
    });

    await sendTransaction(
      {
        to: CHARACTER_CONTRACT_ADDRESS,
        data,
      },
      {
        address: wallets[0].address,
      }
    );

    alert("민팅 트랜잭션 전송 성공");
    console.log("[v0] Minting character:", characterName);
    setStepNum(2);
  };

  useEffect(() => {
    if (characterName !== "" && characterPrompt !== "") {
      setSettingDone(true);
    } else {
      setSettingDone(false);
    }
  }, [characterName, characterPrompt]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/monstar-arcade.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {isWalletConnected && (
        <div className="absolute top-4 right-4 z-40 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
          연결됨: {wallets[0]?.address}
        </div>
      )}
      {stepNum == 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-4xl w-full"
        >
          <button
            onClick={() => router.push("/")}
            className="mb-6 text-purple-600 hover:text-purple-800 font-bold flex items-center gap-2"
            style={{ fontFamily: "'NanumKarGugSu', cursive" }}
          >
            ← 돌아가기
          </button>

          <h1
            className="text-4xl font-black text-center mb-8 text-purple-600"
            style={{ fontFamily: "'NanumKarGugSu', cursive" }}
          >
            나만의 캐릭터 생성하기
          </h1>

          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label
                className="block text-3xl font-bold mb-2 text-gray-700"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                캐릭터 이름
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="캐릭터 이름을 입력하세요"
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-lg"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              />
            </div>
            {/* Prompt Input */}
            <div>
              <label
                className="block text-3xl font-bold mb-2 text-gray-700"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                캐릭터 설정 (프롬프트)
              </label>
              <textarea
                value={characterPrompt}
                onChange={(e) => setCharacterPrompt(e.target.value)}
                placeholder="캐릭터의 외모, 성격, 특징 등을 자유롭게 설명해주세요&#10;예시: 파란 머리를 가진 귀여운 별 캐릭터, 큰 눈과 미소를 가지고 있어요"
                rows={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-lg resize-none"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              disabled={!characterName.trim() || !characterPrompt.trim()}
              className="w-full py-4 rounded-xl font-bold text-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #9b6dd6 0%, #8b5ac9 100%)",
                fontFamily: "'NanumKarGugSu', cursive",
              }}
            >
              생성하기
            </motion.button>
          </div>
        </motion.div>
      )}
      {stepNum == 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-5xl w-full bg-white"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Character Image */}
            <div className="flex items-center justify-center">
              <img
                src={imgUrl}
                alt="캐릭터 이미지"
                className="w-full aspect-square rounded-2xl"
              />
            </div>
            {/* Right Side - Character Info */}
            <div className="flex flex-col justify-between mt-2.5">
              <h2
                className="text-3xl font-bold text-black mb-6 text-center"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                캐릭터를 민팅해주세요
              </h2>
              <div className="space-y-6">
                <div>
                  <h3
                    className="text-3xl font-black text-black mb-2"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    이름
                  </h3>
                  <p
                    className="text-xl text-gray-800"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {characterName}
                  </p>
                </div>
                <div>
                  <h3
                    className="text-3xl font-black text-black mb-2"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    설정
                  </h3>
                  <p
                    className="text-xl text-gray-800"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {characterPrompt}
                  </p>
                </div>
                <div>
                  <h3
                    className="text-3xl font-black text-black mb-2"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    생성 날짜
                  </h3>
                  <p
                    className="text-xl text-gray-800"
                    style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                  >
                    {createdDate}
                  </p>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStepNum(0)}
                  className="flex-1 py-3 rounded-xl font-bold text-lg text-white border-2 border-white bg-[#9b6dd6]"
                  style={{
                    fontFamily: "'NanumKarGugSu', cursive",
                  }}
                >
                  캐릭터 설정 다시하기
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMint}
                  className="flex-1 py-3 rounded-xl font-bold text-lg text-white border-2 border-white  bg-[#9b6dd6]"
                  style={{
                    fontFamily: "'NanumKarGugSu', cursive",
                  }}
                >
                  민팅하기 (1mon)
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {stepNum == 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-5xl w-full bg-white"
        >
          <div className="grid grid-cols-2 gap-8">
            <div className="flex items-center justify-center">
              <img
                src={imgUrl}
                alt="캐릭터 이미지"
                className="w-full aspect-square rounded-2xl"
              />
            </div>

            <div className="flex flex-col justify-center space-y-6 mt-2.5">
              <h2
                className="text-3xl font-black text-black text-center mb-4"
                style={{ fontFamily: "'NanumKarGugSu', cursive" }}
              >
                캐릭터 민팅에 성공하였습니다
              </h2>

              <div>
                <h3
                  className="text-3xl font-black text-black mb-2"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  이름
                </h3>
                <p
                  className="text-xl text-gray-800"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  {characterName}
                </p>
              </div>

              <div>
                <h3
                  className="text-3xl font-black text-black mb-2"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  설정
                </h3>
                <p
                  className="text-xl text-gray-800"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  {characterPrompt}
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 pt-4">
                <p
                  className="text-xl text-gray-800"
                  style={{ fontFamily: "'NanumKarGugSu', cursive" }}
                >
                  지금 바로 아래 버튼을 눌러 배틀을 즐기세요!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    router.push(`/my-page`);
                  }}
                  className="w-full  py-3 rounded-xl font-bold text-lg text-white border-2 border-white cursor-pointer"
                  style={{
                    background: "#9b6dd6",
                    fontFamily: "'NanumKarGugSu', cursive",
                  }}
                >
                  🎉 환영합니다 🎉
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

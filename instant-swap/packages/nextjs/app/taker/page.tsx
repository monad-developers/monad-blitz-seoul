"use client";

import { useCallback, useState } from "react";
import type { NextPage } from "next";
import { getContract } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ArrowPathIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { SwapOrderDisplay } from "~~/components/scaffold-eth/SwapOrderDisplay";
import { ERC20_ABI } from "~~/components/scaffold-eth/TokenInput";
import {
  useDeployedContractInfo,
  useScaffoldContract,
  useScaffoldWriteContract,
  useTransactor,
} from "~~/hooks/scaffold-eth";
import { SwapOrder } from "~~/types/order";

const TakerPage: NextPage = () => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient(); // data 필요 없음

  const { address: connectedAddress } = useAccount();
  const [uploadedOrder, setUploadedOrder] = useState<SwapOrder | null>(null);
  const [makerSignature, setMakerSignature] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        // const orderJson = JSON.parse(content) as { order: SwapOrder };
        const orderJson = JSON.parse(content);
        const order: SwapOrder = orderJson.order;
        const signature = orderJson.signature;
        console.log(order);
        console.log(signature);

        // Basic validation
        if (
          !order.maker ||
          !order.taker ||
          !order.tokenM ||
          !order.tokenT ||
          !order.amountM ||
          !order.amountT ||
          !order.expiry ||
          !order.nonce
        ) {
          throw new Error("Invalid order format");
        }

        setUploadedOrder(order);
        setMakerSignature(signature);
      } catch (err) {
        setError("Failed to parse order file. Please make sure it's a valid swap order JSON file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  }, []);

  const { writeContractAsync: writeInstantSwapAsync } = useScaffoldWriteContract({
    contractName: "InstantSwap",
  });
  const { data: instantSwapInfo } = useDeployedContractInfo({
    contractName: "InstantSwap",
  });

  const transactor = useTransactor();

  const handleInstantSwap = async () => {
    if (!uploadedOrder || !instantSwapInfo) return;
    setIsLoading(true);
    setError("");

    try {
      // 1) approve
      await walletClient?.writeContract({
        address: uploadedOrder.tokenT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [instantSwapInfo.address, uploadedOrder.amountT],
      });

      // 2) swap
      await writeInstantSwapAsync({
        functionName: "instantSwap",
        args: [
          {
            maker: uploadedOrder.maker,
            taker: uploadedOrder.taker,
            tokenM: uploadedOrder.tokenM,
            tokenT: uploadedOrder.tokenT,
            amountM: uploadedOrder.amountM,
            amountT: uploadedOrder.amountT,
            expiry: uploadedOrder.expiry,
            nonce: uploadedOrder.nonce,
          },
          makerSignature as `0x${string}`,
        ],
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Available Swap Proposals</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col mt-4">
            <p className="my-2 font-medium">Your Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-8 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-2xl rounded-3xl w-full">
              <ArrowPathIcon className="h-8 w-8 fill-secondary mb-4" />
              <h2 className="text-2xl font-bold mb-4">Upload Swap Proposal</h2>
              <div className="w-full">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Upload Swap Order JSON</span>
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="file-input file-input-bordered w-full"
                  />
                  {error && (
                    <label className="label">
                      <span className="label-text-alt text-error">{error}</span>
                    </label>
                  )}
                </div>

                {uploadedOrder && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Swap Order Details</h3>
                    <SwapOrderDisplay order={uploadedOrder} />
                    <button className="btn btn-primary w-full mt-4" onClick={handleInstantSwap}>
                      Accept and Execute Swap
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-2xl rounded-3xl w-full">
              <h2 className="text-2xl font-bold mb-4">Your Accepted Swaps</h2>
              <div className="w-full">
                {/* We'll add the list of accepted swaps here */}
                <p className="text-base-content/70">No accepted swaps yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TakerPage;

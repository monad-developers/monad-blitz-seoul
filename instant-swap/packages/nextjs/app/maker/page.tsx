"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { encodePacked, isAddress, keccak256 } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { ERC20_ABI, TokenInput } from "~~/components/scaffold-eth/TokenInput";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";

const MakerPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [sourceToken, setSourceToken] = useState("");
  const [sourceAmount, setSourceAmount] = useState("");
  const [targetToken, setTargetToken] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [takerAddress, setTakerAddress] = useState("");
  const [error, setError] = useState("");

  const { data: instantSwapInfo } = useDeployedContractInfo({
    contractName: "InstantSwap",
  });

  const createOrder = async () => {
    if (!instantSwapInfo) return;

    setError("");

    if (!connectedAddress || !walletClient || !sourceToken || !targetToken || !sourceAmount || !targetAmount) {
      setError("Please fill in all required fields");
      return;
    }

    if (takerAddress && !isAddress(takerAddress)) {
      setError("Invalid taker address");
      return;
    }

    try {
      // Create order object
      const order = {
        maker: connectedAddress,
        taker: takerAddress || "0x0000000000000000000000000000000000000000", // Use zero address if no specific taker
        tokenM: sourceToken,
        tokenT: targetToken,
        amountM: BigInt(sourceAmount) * BigInt(10 ** 18),
        amountT: BigInt(targetAmount) * BigInt(10 ** 18),
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
        nonce: BigInt(Math.floor(Math.random() * 1000000000)),
      };

      // maker approve
      await walletClient?.writeContract({
        address: order.tokenM as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [instantSwapInfo.address, order.amountM],
      });

      const domain = {
        name: "InstantSwap",
        version: "1",
        chainId: await walletClient.chain?.id,
        verifyingContract: instantSwapInfo.address,
      };

      const types = {
        SwapOrder: [
          { name: "maker", type: "address" },
          { name: "taker", type: "address" },
          { name: "tokenM", type: "address" },
          { name: "tokenT", type: "address" },
          { name: "amountM", type: "uint256" },
          { name: "amountT", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "SwapOrder",
        message: order,
      });

      // Create message hash for signing
      // const messageHash = keccak256(
      //   encodePacked(
      //     ["address", "address", "address", "address", "uint256", "uint256", "uint256", "uint256"],
      //     [
      //       order.maker,
      //       order.taker,
      //       order.tokenM,
      //       order.tokenT,
      //       order.amountM,
      //       order.amountT,
      //       order.expiry,
      //       order.nonce,
      //     ],
      //   ),
      // );

      // // Sign the message
      // const signature = await walletClient.signMessage({
      //   message: { raw: messageHash },
      // });

      // Create the final order object with signature
      const orderWithSignature = {
        order,
        signature,
      };

      // Convert to JSON and download
      const blob = new Blob(
        [JSON.stringify(orderWithSignature, (_, value) => (typeof value === "bigint" ? value.toString() : value), 2)],
        { type: "application/json" },
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error creating order:", error);
      setError("Failed to create order. Please try again.");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Create Swap Proposal</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col mt-4">
            <p className="my-2 font-medium">Your Address:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-8 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-2xl rounded-3xl w-full">
              <ArrowsRightLeftIcon className="h-8 w-8 fill-secondary mb-4" />
              <div className="grid grid-cols-1 gap-6 w-full max-w-lg">
                <TokenInput
                  label="Token You Want to Swap"
                  value={sourceToken}
                  onChange={setSourceToken}
                  amount={sourceAmount}
                  onAmountChange={setSourceAmount}
                />

                <TokenInput
                  label="Token You Want to Receive"
                  value={targetToken}
                  onChange={setTargetToken}
                  amount={targetAmount}
                  onAmountChange={setTargetAmount}
                />

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Recipient Address</span>
                  </label>
                  <AddressInput
                    value={takerAddress}
                    onChange={setTakerAddress}
                    placeholder="Enter recipient's address"
                  />
                </div>

                {error && <div className="text-error text-sm text-center">{error}</div>}

                <button
                  className="btn btn-primary mt-4"
                  onClick={createOrder}
                  disabled={!sourceToken || !targetToken || !sourceAmount || !targetAmount}
                >
                  Create and Download Swap Proposal
                </button>
              </div>
            </div>

            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-2xl rounded-3xl w-full">
              <h2 className="text-2xl font-bold mb-4">Your Active Proposals</h2>
              <div className="w-full">
                {/* We'll add the list of active proposals here */}
                <p className="text-base-content/70">No active proposals yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MakerPage;

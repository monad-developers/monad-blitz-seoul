import { useEffect, useState } from "react";
import { Chainlink } from "dev3-sdk";
import { formatUnits, isAddress, parseAbi } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth/Address/Address";
import { AddressInput } from "~~/components/scaffold-eth/Input/AddressInput";

export const ERC20_ABI = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
]);

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  amount: string;
  onAmountChange: (value: string) => void;
  placeholder?: string;
}

export const TokenInput = ({ label, value, onChange, amount, onAmountChange, placeholder }: TokenInputProps) => {
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [tokenBalance, setTokenBalance] = useState<string>("");
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  useEffect(() => {
    const getTokenInfo = async () => {
      if (!value || !publicClient || !userAddress) return;

      // Validate address format
      if (!isAddress(value)) {
        setError("Invalid address format");
        setTokenSymbol("");
        setTokenBalance("");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        // Get token symbol
        const symbol = await publicClient.readContract({
          address: value as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "symbol",
        });

        // Get token decimals
        const decimals = await publicClient.readContract({
          address: value as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        });

        // Get token balance
        const balance = await publicClient.readContract({
          address: value as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [userAddress],
        });

        setTokenSymbol(symbol as string);
        setTokenDecimals(decimals as number);
        setTokenBalance(formatUnits(balance as bigint, decimals as number));
      } catch (err) {
        console.error("Error fetching token info:", err);
        setError("Invalid token contract");
        setTokenSymbol("");
        setTokenBalance("");
      } finally {
        setIsLoading(false);
      }
    };

    getTokenInfo();
  }, [value, publicClient, userAddress]);

  const handleMaxClick = () => {
    if (tokenBalance) {
      onAmountChange(tokenBalance);
    }
  };

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <div className="flex gap-2 items-center">
        <div className="flex-grow">
          <AddressInput value={value} onChange={onChange} placeholder={placeholder || "Enter token address"} />
        </div>
        {isLoading && <div className="badge badge-ghost">Loading...</div>}
        {!isLoading && tokenSymbol && <div className="badge badge-primary">{tokenSymbol}</div>}
        {!isLoading && error && <div className="badge badge-error">{error}</div>}
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <label className="label-text-alt">
            {tokenBalance && `Balance: ${Number(tokenBalance).toFixed(4)} ${tokenSymbol}`}
          </label>
          {tokenBalance && (
            <button className="btn btn-xs btn-ghost" onClick={handleMaxClick}>
              MAX
            </button>
          )}
        </div>
        <input
          type="number"
          placeholder="Amount"
          className="input input-bordered w-full"
          value={amount}
          onChange={e => onAmountChange(e.target.value)}
          max={tokenBalance}
        />
      </div>
    </div>
  );
};

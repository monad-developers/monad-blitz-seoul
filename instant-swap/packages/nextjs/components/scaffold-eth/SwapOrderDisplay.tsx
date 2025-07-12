import { formatUnits } from "viem";
import { useToken } from "wagmi";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";
import { SwapOrder } from "~~/types/order";

interface Props {
  order: SwapOrder;
}

export const SwapOrderDisplay = ({ order }: Props) => {
  const { data: makerToken } = useToken({ address: order.tokenM as `0x${string}` });
  const { data: takerToken } = useToken({ address: order.tokenT as `0x${string}` });

  const formatExpiryTime = (expiry: string) => {
    const expiryTime = parseInt(expiry) * 1000; // 초를 밀리초로 변환
    const now = Date.now();
    const remainingTime = expiryTime - now;

    // 만료된 경우
    if (remainingTime <= 0) {
      return "Expired";
    }

    // 남은 시간 계산
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

    // 시간과 분 표시
    if (hours > 0) {
      return `Expires in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `Expires in ${minutes}m`;
    } else {
      return "Expires soon";
    }
  };

  const formatTokenAmount = (amount: bigint, decimals: number = 18) => {
    try {
      return formatUnits(amount, decimals);
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return amount.toString();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-200 rounded-2xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-start">
          <span className="text-sm opacity-60">Maker Token</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold"> {formatTokenAmount(order.amountM, makerToken?.decimals || 18)}</span>
            <span className="text-sm font-medium">{makerToken?.symbol}</span>
          </div>
          <Address address={order.tokenM} />
        </div>
        <ArrowPathIcon className="h-6 w-6" />
        <div className="flex flex-col items-end">
          <span className="text-sm opacity-60">Taker Token</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold"> {formatTokenAmount(order.amountT, takerToken?.decimals || 18)}</span>
            <span className="text-sm font-medium">{takerToken?.symbol}</span>
          </div>
          <Address address={order.tokenT} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-sm opacity-60">Maker</span>
          <Address address={order.maker} />
        </div>
        <div className="flex justify-between">
          <span className="text-sm opacity-60">Taker</span>
          <Address address={order.taker} />
        </div>
        <div className="flex justify-between">
          <span className="text-sm opacity-60">Expiry</span>
          <span> {new Date(parseInt(order.expiry.toString()) * 1000).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

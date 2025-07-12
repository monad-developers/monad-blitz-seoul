"use client";

import { useState } from "react";
import { useScaffoldWatchContractEvent, useScaffoldWriteContract } from "./scaffold-eth";

export function useOrder() {
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "Protocol",
  });

  const order = (storeAddress: string, menuList: bigint[], totalValue: bigint) =>
    writeContractAsync({
      functionName: "order",
      args: [storeAddress, menuList],
      value: totalValue,
    });

  const confirm = (orderIndex: bigint) =>
    writeContractAsync({
      functionName: "confirmOrder",
      args: [orderIndex],
    });

  const [calls, setCalls] = useState<
    {
      orderIndex: bigint;
      storeAddress: string;
      deliveryFee: bigint;
      distance: bigint;
      userAddress: string;
    }[]
  >([]);

  useScaffoldWatchContractEvent({
    contractName: "Protocol",
    eventName: "OrderMenu",
    onLogs: logs => {
      logs.forEach(log => {
        const { order_index, delivery_fee, distance, user_address, store_address } = log.args;

        console.log("OrderMenu event:", {
          orderIndex: order_index,
          deliveryFee: delivery_fee,
          distance,
          userAddress: user_address,
          storeAddress: store_address,
        });

        if (!order_index) return;

        setCalls(prevOrders => [
          ...prevOrders,
          {
            orderIndex: order_index,
            storeAddress: store_address ?? "",
            deliveryFee: delivery_fee ?? BigInt(0),
            distance: distance ?? BigInt(0),
            userAddress: user_address ? user_address : "",
          },
        ]);
      });
    },
  });

  const take = ({ orderIndex }: { orderIndex: bigint }) =>
    writeContractAsync({
      functionName: "approveDelivery",
      args: [orderIndex],
    });

  return {
    order,
    confirm,
    calls,
    take,
  };
}

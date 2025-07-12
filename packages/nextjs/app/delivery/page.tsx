"use client";

import type { NextPage } from "next";
import { useOrder } from "~~/hooks/useOrder";

const Delivery: NextPage = () => {
  const { calls, take } = useOrder();

  return (
    <>
      <div className="text-center mt-8 bg-primary p-10">
        <h1 className="text-4xl my-0">Delivery Calls</h1>
      </div>

      <ol className="list-decimal list-inside">
        {calls.map(({ orderIndex, deliveryFee, distance, storeAddress, userAddress }) => (
          <li key={orderIndex} className="my-2">
            <div className="text-blue-500 hover:underline">
              <h2>Order Index: {orderIndex.toString()}</h2>
              <p>Store Address: {storeAddress}</p>
              <p>Delivery Fee: {deliveryFee.toString()} ETH</p>
              <p>Distance: {distance.toString()} meters</p>
              <p>User Address: {userAddress}</p>
            </div>

            <button className="ml-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => take({ orderIndex })}>
              Take Delivery
            </button>
          </li>
        ))}
      </ol>
    </>
  );
};

export default Delivery;

import type { NextPage } from "next";
// import { useAccount } from "wagmi";
// import { useOrder } from "~~/hooks/useOrder";
// import { useOrderList } from "~~/hooks/useOrderList";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Orders",
  description: "Your orders",
});

const Orders: NextPage = () => {
  // const { address: connectedAddress } = useAccount();
  // const { data: orders } = useOrderList(connectedAddress);
  // const { confirm } = useOrder();

  return (
    <>
      <div className="text-center mt-8 bg-primary p-10">
        <h1 className="text-4xl my-0">Your Orders</h1>
      </div>
      {/* 
      {orders.map(({ order_index }) => (
        <div key={order_index}>
          {order_index}
          <button className="ml-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => confirm(order_index)}>
            Confirm
          </button>
        </div>
      ))} */}
    </>
  );
};

export default Orders;

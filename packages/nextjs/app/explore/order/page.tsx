"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Menu } from "../[slug]/page";
import { useOrder } from "~~/hooks/useOrder";
import { useStoreList } from "~~/hooks/useStoreList";

function Order() {
  const searchParams = useSearchParams();
  const storeAddress = searchParams.get("slug");
  const menuListParam = searchParams.get("menuList");

  const { data: storeList } = useStoreList();
  const { order } = useOrder();

  const [isOrdering, setIsOrdering] = useState(false);

  const selectedMenu = menuListParam ? (JSON.parse(menuListParam) as Menu[]) : [];

  const store = storeList?.find(store => store.addr === storeAddress);

  const totalPrice = selectedMenu.reduce((acc, menu) => acc + BigInt(menu.price), BigInt(0));

  const deliveryFee = BigInt(1000) * (store?.pos ?? BigInt(1)); // 1000 won
  const totalValue = totalPrice + deliveryFee;

  const handleOrder = async () => {
    if (!selectedMenu.length) return;

    try {
      setIsOrdering(true);
      const menuIndexes = selectedMenu.map(menu => BigInt(menu.index));
      await order(storeAddress ?? "", menuIndexes, totalValue);
    } catch (error) {
      console.error("Order failed:", error);
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">주문 확인</h1>

      {/* Store Info */}
      <div className="bg-primary p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold">{store?.name}</h2>
        <p className="text-gray-600">{store?.description}</p>
        <p className="text-sm text-gray-500">{store?.location}</p>
      </div>

      {/* Selected Menu Items */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">선택된 메뉴</h3>
        {selectedMenu.length === 0 ? (
          <p className="text-gray-500">선택된 메뉴가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {selectedMenu.map((menu: any, index: number) => (
              <li key={index} className="flex justify-between items-center p-3 border-b">
                <div>
                  <h4 className="font-medium">{menu.name}</h4>
                  <p className="text-sm text-gray-600">Index: {menu.index.toString()}</p>
                </div>
                <span className="font-semibold">{menu.price.toString()} 원</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span>메뉴 총액:</span>
          <span>{totalPrice.toString()} 원</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span>배송비:</span>
          <span>{deliveryFee.toString()} 원</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between items-center font-bold text-lg">
          <span>총 결제금액:</span>
          <span>{totalValue.toString()} 원</span>
        </div>
      </div>

      {/* Order Button */}
      <button
        onClick={handleOrder}
        disabled={selectedMenu.length === 0 || isOrdering}
        className={`w-full py-3 px-4 rounded-lg font-semibold ${
          selectedMenu.length === 0 || isOrdering
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-secondary text-white hover:bg-secondary/90"
        }`}
      >
        {isOrdering ? "주문 중..." : `${totalValue.toString()} 원 주문하기`}
      </button>

      <div className="mt-4 text-center">
        <button onClick={() => window.history.back()} className="text-blue-500 hover:underline">
          ← 돌아가기
        </button>
      </div>
    </div>
  );
}

export default Order;

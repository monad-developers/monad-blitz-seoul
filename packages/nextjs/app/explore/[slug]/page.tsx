"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMenu } from "~~/hooks/useMenu";
import { useStoreList } from "~~/hooks/useStoreList";

interface Props {
  params: Promise<{ slug: string }>;
}

export interface Menu {
  index: string;
  name: string;
  price: number;
}

const Store = ({ params }: Props) => {
  const { slug: storeAddress } = use(params);
  const { data: menuList } = useMenu(storeAddress);
  const { data: storeList } = useStoreList();

  const store = storeList?.find(store => store.addr === storeAddress);

  const [selectedMenu, setSelectedMenu] = useState<Menu[]>([]);

  return (
    <>
      {/* Store Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold">{store?.name || "매장 정보"}</h1>
          <p className="text-orange-100 mt-2">{store?.description}</p>
          <p className="text-orange-100 text-sm mt-1">📍 {store?.location}</p>
        </div>
      </div>

      {/* Menu List */}
      <div className="container mx-auto px-6 py-8 pb-32">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">메뉴</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuList?.map(({ description, image_url, index, name, price }) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <button
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-300"
                onClick={() =>
                  setSelectedMenu(prev => [
                    ...prev,
                    {
                      index: index.toString(),
                      name,
                      price: Number(price),
                    },
                  ])
                }
              >
                {image_url && (
                  <img
                    src={image_url}
                    alt={name}
                    width={300}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{name}</h3>
                <p className="text-gray-600 text-sm mb-3">{description}</p>
                <p className="text-xl font-bold text-orange-600">{Number(price).toLocaleString()}원</p>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Cart */}
      {selectedMenu.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-left">
              <div className="text-sm text-gray-600">선택된 메뉴 {selectedMenu.length}개</div>
              <div className="text-lg font-bold text-gray-800">
                총 {selectedMenu.reduce((acc, cur) => acc + Number(cur.price), 0).toLocaleString()}원
              </div>
            </div>
            <Link
              href={{
                pathname: "/explore/order",
                query: { slug: storeAddress, menuList: JSON.stringify(selectedMenu) },
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-colors duration-300"
            >
              주문하기
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Store;

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import {
  ClockIcon,
  FunnelIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useStoreList } from "~~/hooks/useStoreList";

// Store type from smart contract
type Store = {
  addr: string;
  location: string;
  pos: bigint;
  name: string;
  description: string;
};

// Enhanced store type for UI
type EnhancedStore = Store & {
  category: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: string;
  image: string;
  isNew: boolean;
};

const Explore: NextPage = () => {
  const { data: storeList = [], isLoading, error } = useStoreList();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<string[]>([]);

  const categories = [
    { id: "all", name: "전체", emoji: "🍽️" },
    { id: "korean", name: "한식", emoji: "🍚" },
    { id: "pizza", name: "피자", emoji: "🍕" },
    { id: "chicken", name: "치킨", emoji: "🍗" },
    { id: "burger", name: "버거", emoji: "🍔" },
    { id: "chinese", name: "중식", emoji: "🥢" },
    { id: "japanese", name: "일식", emoji: "🍱" },
    { id: "dessert", name: "디저트", emoji: "🧁" },
  ];

  const toggleFavorite = (storeAddr: string) => {
    setFavorites(prev => (prev.includes(storeAddr) ? prev.filter(addr => addr !== storeAddr) : [...prev, storeAddr]));
  };

  // Enhanced store data with UI properties
  const enhancedStores: EnhancedStore[] = useMemo(() => {
    return (storeList as Store[]).map((store, index) => {
      // Generate UI properties based on store data
      const categories = ["korean", "pizza", "chicken", "burger", "chinese", "japanese", "dessert"];
      const images = ["�", "🍕", "🍗", "🍔", "🥢", "🍱", "🧁"];
      const categoryIndex = Math.abs(parseInt(store.addr.slice(-2), 16)) % categories.length;

      return {
        ...store,
        category: categories[categoryIndex],
        rating: 4.2 + (Math.abs(parseInt(store.addr.slice(-4, -2), 16)) % 8) / 10, // 4.2-4.9
        reviewCount: 50 + (Math.abs(parseInt(store.addr.slice(-6, -4), 16)) % 300), // 50-349
        deliveryTime: `${15 + (Math.abs(parseInt(store.addr.slice(-8, -6), 16)) % 20)}-${25 + (Math.abs(parseInt(store.addr.slice(-8, -6), 16)) % 20)}분`,
        deliveryFee: `${1000 + (Math.abs(parseInt(store.addr.slice(-10, -8), 16)) % 3000)}원`,
        image: images[categoryIndex],
        isNew: index < 2, // First 2 stores are marked as new
      };
    });
  }, [storeList]);

  const filteredStores = useMemo(() => {
    return enhancedStores.filter(store => {
      const matchesSearch =
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || store.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [enhancedStores, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">맛있는 음식을 찾아보세요</h1>
            <p className="text-xl text-orange-100 mb-8">지역 최고의 음식점들이 여러분을 기다립니다</p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="음식점이나 음식 종류를 검색해보세요..."
                  className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 text-lg"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">카테고리</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full border-2 transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                <span>{category.emoji}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Store Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-3 w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-3 w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">데이터를 불러올 수 없습니다</h3>
            <p className="text-gray-600">잠시 후 다시 시도해주세요</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStores.map(store => (
              <Link key={store.addr} href={`/explore/${store.addr}`} className="group">
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                  {/* Store Image */}
                  <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-6xl">{store.image}</span>

                    {/* Favorite Button */}
                    <button
                      onClick={e => {
                        e.preventDefault();
                        toggleFavorite(store.addr);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform duration-300"
                    >
                      {favorites.includes(store.addr) ? (
                        <HeartSolidIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* New Badge */}
                    {store.isNew && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        NEW
                      </div>
                    )}
                  </div>

                  {/* Store Info */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">
                        {store.name}
                      </h3>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{store.description}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-800">{store.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-600">({store.reviewCount}+)</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 mb-3">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{store.location}</span>
                      <span className="text-sm text-gray-400">• {Number(store.pos).toFixed(1)}km</span>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">{store.deliveryTime}</span>
                      </div>
                      <div className="text-sm text-gray-600">배송비 {Number(store.pos) * 1000}원</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && filteredStores.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">다른 검색어나 카테고리를 시도해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;

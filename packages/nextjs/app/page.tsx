"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightIcon, CreditCardIcon, ShoppingBagIcon, StarIcon, TruckIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="20" fill="none" stroke="#ff6b35" strokeWidth="1" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Left Content */}
            <div className="lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  Monad Go
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
                블록체인 기반 음식 배달의 새로운 경험
                <br />
                <span className="text-orange-500 font-semibold">빠르고, 투명하고, 안전하게</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/explore"
                  className="btn btn-primary btn-lg px-8 py-4 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  지금 주문하기
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  href="/store"
                  className="btn btn-outline btn-lg px-8 py-4 rounded-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold transition-all duration-300"
                >
                  매장 등록하기
                </Link>
              </div>
            </div>

            {/* Right Content - Illustration */}
            <div className="lg:w-1/2 relative">
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 mx-auto max-w-md">
                <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-full">
                  <ShoppingBagIcon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-4xl">🍕</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Pizza Paradise</h3>
                  <p className="text-gray-600 mb-4">신선한 재료로 만든 프리미엄 피자</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">4.9 (250+)</span>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    15-25분 배송
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              왜 <span className="text-orange-500">Monad Go</span>인가?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              블록체인 기술로 더욱 투명하고 안전한 음식 배달 서비스를 제공합니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCardIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">안전한 결제</h3>
              <p className="text-gray-600 leading-relaxed">
                블록체인 기반 스마트 컨트랙트로 안전하고 투명한 결제 시스템을 제공합니다
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TruckIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">실시간 배송 추적</h3>
              <p className="text-gray-600 leading-relaxed">
                주문부터 배송까지 모든 과정을 실시간으로 투명하게 확인할 수 있습니다
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl hover:shadow-lg transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShoppingBagIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">다양한 음식점</h3>
              <p className="text-gray-600 leading-relaxed">
                지역 최고의 음식점들과 파트너십을 맺어 다양한 메뉴를 제공합니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-orange-100">등록된 음식점</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-orange-100">완료된 주문</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15분</div>
              <div className="text-orange-100">평균 배송 시간</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9★</div>
              <div className="text-orange-100">고객 만족도</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">지금 바로 시작하세요!</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Monad Go와 함께 새로운 음식 배달 경험을 시작해보세요. 블록체인의 투명성과 편리함을 동시에 누려보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="btn btn-primary btn-lg px-8 py-4 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              음식 주문하기
            </Link>
            <Link
              href="/orders"
              className="btn btn-outline btn-lg px-8 py-4 rounded-full border-2 border-gray-400 text-gray-700 hover:bg-gray-700 hover:text-white font-semibold transition-all duration-300"
            >
              주문 내역 보기
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

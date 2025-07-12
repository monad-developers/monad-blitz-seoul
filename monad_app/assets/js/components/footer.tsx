import React from "react";
import { MapPin, Instagram, MessageCircle, Plane } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-full px-8">
        <div className="grid grid-cols-4 gap-16 mb-12">
          {/* 브랜드 정보 */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <h5 className="text-4xl font-bold font-gugi">런치 옥션</h5>
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
              자산을 기반으로 한 진정한 매칭 서비스입니다. 경제적 안정성과
              가치관이 맞는 이상적인 파트너를 찾아드립니다. 품격 있는 만남을
              시작하세요.
            </p>
            <div className="flex space-x-6">
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <MessageCircle className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* 전시 메뉴 */}
          <div>
            <h6 className="text-lg font-semibold mb-8">매칭 서비스</h6>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  자산 인증
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  프리미엄 매칭
                </a>
              </li>
            </ul>
          </div>

          {/* 작가 메뉴 */}
          <div>
            <h6 className="text-lg font-semibold mb-8">회원 관리</h6>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  프로필 관리
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  매칭 기록
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  선호도 설정
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  멤버십 안내
                </a>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h6 className="text-lg font-semibold mb-8">고객지원</h6>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  자주 묻는 질문
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  문의하기
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  이용 안내
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  공지사항
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 런치 옥션. All rights reserved.
            </p>
            <div className="flex space-x-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                이용약관
              </a>
              <a href="#" className="hover:text-white transition-colors">
                개인정보처리방침
              </a>
              <a href="#" className="hover:text-white transition-colors">
                쿠키정책
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

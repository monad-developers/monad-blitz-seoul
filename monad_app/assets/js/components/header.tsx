import React, { useState, useRef, useEffect } from "react";
import { Link, usePage, useForm } from "@inertiajs/react";
import {
  Plane,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  User,
} from "lucide-react";

const Header = () => {
  const { props } = usePage();
  const user = props.user;
  const { delete: destroy } = useForm();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    destroy("/users/log_out");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-gray-50 px-8 py-6">
      <div className="max-w-full flex justify-between items-center relative">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-4xl font-bold text-gray-900 font-gugi">
            런치 옥션
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={20} />
                <span>{user.nick_name}님</span>
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm text-gray-600">안녕하세요,</p>
                    <p className="font-medium text-gray-900">
                      {user.nick_name}님
                    </p>
                  </div>
                  <Link
                    href="/users/profile"
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <span>프로필 조회</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/register"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <UserPlus size={16} />
                <span>회원가입</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LogIn size={16} />
                <span>로그인</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

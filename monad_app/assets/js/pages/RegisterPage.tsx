import React, { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import {
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Wallet,
} from "lucide-react";

interface RegisterProps {}

const RegisterPage = (props: RegisterProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const { data, setData, post, processing } = useForm({
    email: "",
    nick_name: "",
    phone_number: "",
    crypto_wallet_address: "",
    password: "",
    password_confirmation: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">런치 옥션에 가입하세요</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* Nickname Field */}
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                닉네임
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nickname"
                  type="text"
                  value={data.nick_name}
                  onChange={(e) => setData("nick_name", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="닉네임을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                전화번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone_number"
                  type="tel"
                  value={data.phone_number}
                  onChange={(e) => setData("phone_number", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="전화번호를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* Crypto Wallet Address Field */}
            <div>
              <label
                htmlFor="crypto_wallet_address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                지갑 주소
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Wallet className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="crypto_wallet_address"
                  type="text"
                  value={data.crypto_wallet_address}
                  onChange={(e) =>
                    setData("crypto_wallet_address", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="지갑 주소를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Confirmation Field */}
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password_confirmation"
                  type={showPasswordConfirmation ? "text" : "password"}
                  value={data.password_confirmation}
                  onChange={(e) =>
                    setData("password_confirmation", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirmation(!showPasswordConfirmation)
                  }
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswordConfirmation ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
                processing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }`}
            >
              {processing ? "가입 중..." : "회원가입"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

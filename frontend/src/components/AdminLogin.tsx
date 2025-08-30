import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import Layout, { Card, Button } from './Layout';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 메시지 초기화
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
  console.log('🚀 로그인 시도:', formData.email);
  // 실제 백엔드 로그인 API 호출
  const response = await login(formData.email, formData.password);
  localStorage.setItem('adminToken', response.token);
  localStorage.setItem('adminEmail', response.user.email);
  localStorage.setItem('adminUser', JSON.stringify(response.user));
  console.log('✅ 로그인 성공:', response.user.email);
  navigate('/event-list');
      
    } catch (err) {
      console.error('❌ 로그인 오류:', err);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Layout 
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      pageTitle="관리자 로그인"
      showHeader={false}
    >
      {/* 페이지 헤더 */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield size={32} className="text-white" />
          </div>
        </div>
        <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          로그인
        </h1>
        <p className="text-base xl:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          이벤트 관리 시스템에 접속하려면 로그인해주세요.
        </p>
      </div>

      {/* 로그인 폼 */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Card isDarkMode={isDarkMode} className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 이메일 입력 */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="이메일을 입력하세요"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                    placeholder="비밀번호를 입력하세요"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* 로그인 버튼 */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    로그인 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Lock size={16} className="mr-2" />
                    로그인
                  </div>
                )}
              </Button>
            </form>

                         {/* 회원가입 링크 */}
             <div className="mt-6 text-center">
               <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                 아직 계정이 없으신가요?
               </p>
               <Button
                 variant="outline"
                 size="md"
                 onClick={() => navigate('/admin-signup')}
                 className="w-full"
               >
                 회원가입
               </Button>
             </div>
          </Card>
        </div>
      </div>

      {/* 하단 안내 */}
    </Layout>
  );
};

export default AdminLogin;

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Menu } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode, pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const themeClasses = {
    headerBg: isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    cardBg: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  };

  const navItems = [
    { path: '/event-creation', label: '이벤트 생성 / 관리' },
    { path: '/prize-management', label: '경품 관리' },
    { path: '/field-settings', label: '필드 설정' },
    { path: '/entry-status', label: '응모 현황' },
  ];

  const NavLink = ({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) => (
    <button
      onClick={() => navigate(href)}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${isActive 
          ? 'text-purple-700 bg-purple-50 border border-purple-200' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      {children}
    </button>
  );

  return (
    <header className={`${themeClasses.headerBg} border-b backdrop-blur-md sticky top-0 z-50`}>
      <div className="max-w-6xl mx-auto px-6 xl:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/event-creation')}>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h1 className={`text-xl font-semibold ${themeClasses.text}`}>Monad</h1>
                <p className={`text-xs ${themeClasses.textSecondary}`}>경품 응모 시스템</p>
              </div>
            </div>
            
            {/* PC 네비게이션 */}
            <nav className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <NavLink 
                  key={item.path}
                  href={item.path}
                  isActive={location.pathname === item.path}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* 우측 액션 영역 */}
          <div className="flex items-center space-x-4">
            {/* 다크모드 토글 */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {isDarkMode ? <Eye size={16} className="text-yellow-400" /> : <EyeOff size={16} className="text-gray-600" />}
            </button>
            
            {/* 모바일 메뉴 버튼 */}
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} className={themeClasses.text} />
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <NavLink 
                  key={item.path}
                  href={item.path}
                  isActive={location.pathname === item.path}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
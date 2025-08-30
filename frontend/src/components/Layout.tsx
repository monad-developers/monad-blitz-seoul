import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
  pageTitle: string;
  className?: string;
  showHeader?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  isDarkMode, 
  setIsDarkMode, 
  pageTitle, 
  className = '',
  showHeader = true
}) => {
  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {showHeader && (
        <Header 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          pageTitle={pageTitle}
        />
      )}
      <main className={`px-6 xl:px-8 py-8 xl:py-12 ${className}`}>
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// 세로 배치 레이아웃을 위한 유틸리티 컴포넌트
export const GridContainer: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ children, className = '', gap = 'lg' }) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export const GridItem: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
};

// 카드 컴포넌트
export const Card: React.FC<{ 
  children: React.ReactNode;
  className?: string;
  isDarkMode?: boolean;
  hover?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', isDarkMode = false, hover = false, onClick }) => {
  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  };

  const hoverEffect = hover ? 'hover:shadow-lg hover:scale-[1.02] transition-all duration-300' : '';

  return (
    <div 
      className={`
        ${themeClasses.bg} 
        rounded-xl 
        shadow-sm 
        border 
        backdrop-blur-sm 
        p-6 xl:p-8 
        ${hoverEffect}
        ${className}
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// 버튼 컴포넌트
export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button'
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border-2 border-purple-500 text-purple-500 hover:bg-purple-50'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-lg
        font-medium
        transition-all
        duration-200
        hover:shadow-md
        hover:-translate-y-0.5
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:transform-none
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// 입력 필드 컴포넌트
export const Input: React.FC<{
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  isDarkMode?: boolean;
}> = ({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = 'text', 
  required = false, 
  disabled = false,
  className = '',
  isDarkMode = false
}) => {
  const themeClasses = {
    bg: isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    label: isDarkMode ? 'text-gray-300' : 'text-gray-700'
  };

  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full
          px-4
          py-3
          rounded-lg
          border
          ${themeClasses.bg}
          placeholder-gray-400
          focus:ring-4
          focus:ring-purple-500/20
          focus:border-purple-500
          transition-all
          duration-200
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
      />
    </div>
  );
};

export default Layout;
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'eth' | 'btc';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-[#232a30] text-[#B8BFC6]',
    success: 'bg-[#4ADE80]/20 text-[#4ADE80]',
    warning: 'bg-[#FBBF24]/20 text-[#FBBF24]',
    error: 'bg-[#F87171]/20 text-[#F87171]',
    info: 'bg-[#60A5FA]/20 text-[#60A5FA]',
    eth: 'bg-[#627EEA]/20 text-[#627EEA]',
    btc: 'bg-[#F7931A]/20 text-[#F7931A]',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  
  return (
    <span
      className={`
        inline-flex 
        items-center 
        font-medium 
        rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
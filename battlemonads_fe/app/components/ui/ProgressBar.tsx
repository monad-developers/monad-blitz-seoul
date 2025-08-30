import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'default' | 'eth' | 'btc' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  variant = 'default',
  showLabel = false,
  label = '',
  height = 'md',
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const variants = {
    default: 'bg-[#5AD8CC]',
    eth: 'bg-[#627EEA]',
    btc: 'bg-[#F7931A]',
    success: 'bg-[#4ADE80]',
    warning: 'bg-[#FBBF24]',
    error: 'bg-[#F87171]',
  };
  
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-[#B8BFC6]">{label}</span>
          <span className="text-sm text-[#B8BFC6]">
            {value}/{max}
          </span>
        </div>
      )}
      <div className={`w-full bg-[#232a30] rounded-full overflow-hidden ${heights[height]}`}>
        <div
          className={`${variants[variant]} ${heights[height]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
import React from 'react';
import { cn } from '@/lib/utils';
import { BGPattern } from './BGPattern';

interface MinecraftCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const MinecraftCard = ({ children, title, className }: MinecraftCardProps) => {
  return (
    <div
      className={cn(
        'relative bg-[#C6C6C6] rounded-none',
        'border-4 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#555555] border-b-[#555555]',
        'shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]',
        'p-6',
        className
      )}
      style={{ imageRendering: 'pixelated' }}
    >
      <BGPattern variant="checkerboard" size={2} fill="#B0B0B0" className="opacity-20" />
      {title && (
        <div className="relative mb-4 bg-[#3C3C3C] border-2 border-t-[#1C1C1C] border-l-[#1C1C1C] border-r-[#5C5C5C] border-b-[#5C5C5C] p-3">
          <h3 className="text-white font-bold text-xl" style={{ fontFamily: 'monospace' }}>
            {title}
          </h3>
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
};

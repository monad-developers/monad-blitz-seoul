import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const MinecraftButton = React.forwardRef<HTMLButtonElement, MinecraftButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const [isPressed, setIsPressed] = useState(false);

    const baseStyles = "relative font-bold uppercase tracking-wider transition-all duration-75 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

    const pixelatedBorder = "border-2 border-solid";

    const variantStyles = {
      primary: disabled
        ? "bg-[#555555] border-t-[#7F7F7F] border-l-[#7F7F7F] border-r-[#2A2A2A] border-b-[#2A2A2A] text-[#A0A0A0]"
        : "bg-[#55FF55] border-t-[#AAFFAA] border-l-[#AAFFAA] border-r-[#00AA00] border-b-[#00AA00] text-white hover:bg-[#7FFF7F]",
      secondary: disabled
        ? "bg-[#555555] border-t-[#7F7F7F] border-l-[#7F7F7F] border-r-[#2A2A2A] border-b-[#2A2A2A] text-[#A0A0A0]"
        : "bg-[#C6C6C6] border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#555555] border-b-[#555555] text-[#3F3F3F] hover:bg-[#D6D6D6]",
      danger: disabled
        ? "bg-[#555555] border-t-[#7F7F7F] border-l-[#7F7F7F] border-r-[#2A2A2A] border-b-[#2A2A2A] text-[#A0A0A0]"
        : "bg-[#FF5555] border-t-[#FFAAAA] border-l-[#FFAAAA] border-r-[#AA0000] border-b-[#AA0000] text-white hover:bg-[#FF7F7F]",
    };

    const sizeStyles = {
      sm: "px-4 py-2 text-xs min-h-[32px]",
      md: "px-6 py-3 text-sm min-h-[40px]",
      lg: "px-8 py-4 text-base min-h-[48px]",
    };

    const shadowStyles = !disabled && !isPressed
      ? "shadow-[0_4px_0_0_rgba(0,0,0,0.3)]"
      : "";

    const pressedStyles = isPressed && !disabled
      ? "translate-y-[3px] shadow-[0_1px_0_0_rgba(0,0,0,0.3)]"
      : "";

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        setIsPressed(true);
      }
      props.onMouseDown?.(e);
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      props.onMouseUp?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      props.onMouseLeave?.(e);
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          pixelatedBorder,
          variantStyles[variant],
          sizeStyles[size],
          shadowStyles,
          pressedStyles,
          className
        )}
        disabled={disabled}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          imageRendering: 'pixelated',
          fontFamily: 'monospace',
        }}
        {...props}
      >
        <span className="relative z-10 drop-shadow-[1px_1px_0_rgba(0,0,0,0.25)]">
          {children}
        </span>
      </button>
    );
  }
);

MinecraftButton.displayName = 'MinecraftButton';

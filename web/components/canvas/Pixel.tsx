'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface PixelProps {
  x: number
  y: number
  color: string
  isPending?: boolean
  onClick: (x: number, y: number) => void
}

export function Pixel({ x, y, color, isPending, onClick }: PixelProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'aspect-square cursor-pointer pixel-border transition-all duration-200',
        isHovered && 'scale-105 z-10 relative',
        isPending && 'animate-pulse opacity-75'
      )}
      style={{ 
        backgroundColor: color || '#ffffff',
        minWidth: '6px',
        minHeight: '6px'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(x, y)}
      title={`Pixel (${x}, ${y})`}
    >
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
        </div>
      )}
    </div>
  )
}
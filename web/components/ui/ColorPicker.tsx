'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#FF0000',
  '#FF8000',
  '#FFFF00',
  '#80FF00',
  '#00FF00',
  '#00FF80',
  '#00FFFF',
  '#0080FF',
  '#0000FF',
  '#8000FF',
  '#FF00FF',
  '#FF0080',
  '#FFFFFF',
  '#C0C0C0',
  '#808080',
  '#404040',
  '#000000',
  '#800000',
  '#FF8080',
  '#800080',
  '#408040',
  '#004080',
  '#800040',
  '#408080',
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export function ColorPicker({
  selectedColor,
  onColorSelect,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('#000000');

  return (
    <div className="monad-glass rounded-xl p-4 md:p-6 border border-white/10">
      <div className="mb-3">
        <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-monad-primary rounded-full"></div>
          <span>Color Palette</span>
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 md:gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                'w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 cursor-pointer hover:scale-110 transition-all duration-200',
                selectedColor === color 
                  ? 'border-monad-primary shadow-lg shadow-monad-primary/30' 
                  : 'border-white/20 hover:border-white/40'
              )}
              style={{ backgroundColor: color }}
              onClick={() => onColorSelect(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 md:pt-5 mt-4 md:mt-5">
        <h3 className="text-xs md:text-sm font-medium text-gray-300 mb-3">Custom Color</h3>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onColorSelect(e.target.value);
            }}
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              const value = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                setCustomColor(value);
                if (value.length === 7) {
                  onColorSelect(value);
                }
              }
            }}
            className="flex-1 px-2 md:px-3 py-2 text-xs md:text-sm border border-white/20 bg-white/5 text-white rounded-lg transition-all duration-200 focus:border-monad-primary focus:outline-none backdrop-blur-sm"
            placeholder="#000000"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 md:pt-5 mt-4 md:mt-5">
        <h3 className="text-xs md:text-sm font-medium text-gray-300 mb-3">
          Selected Color
        </h3>
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-6 md:w-12 md:h-8 rounded-lg border border-white/20 shadow-lg"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-xs md:text-sm text-gray-300 font-mono">{selectedColor}</span>
        </div>
      </div>
    </div>
  );
}

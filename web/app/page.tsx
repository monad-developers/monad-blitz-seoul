'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Canvas } from '@/components/canvas/Canvas';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Users } from 'lucide-react';

export default function Home() {
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [showUsers, setShowUsers] = useState(false);

  const handlePixelUpdate = (x: number, y: number, color: string) => {
    console.log(`Pixel updated: (${x}, ${y}) -> ${color}`);
  };

  return (
    <div className="min-h-screen monad-pattern relative">
      <Header />

      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8 min-h-[calc(100vh-100px)] max-w-[1600px]">
        <div className="flex lg:grid lg:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 lg:gap-8 h-full">
          {/* Mobile Layout */}
          <div className="lg:hidden col-span-full">
            <div className="flex flex-col space-y-4 md:space-y-6 h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:flex-1">
                  <ColorPicker
                    selectedColor={selectedColor}
                    onColorSelect={setSelectedColor}
                  />
                </div>
                <div className="flex sm:flex-col space-x-3 sm:space-x-0 sm:space-y-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowUsers(!showUsers)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 md:px-4 py-2 monad-glass text-white rounded-lg transition-all duration-200 text-sm hover:bg-white/10"
                  >
                    <Users size={14} />
                    <span className="hidden sm:inline">Users</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex justify-center items-center min-h-[300px]">
                <Canvas
                  selectedColor={selectedColor}
                  onPixelUpdate={handlePixelUpdate}
                />
              </div>
            </div>
          </div>
          {/* Desktop Left Panel - Color Picker */}
          <div className="hidden lg:flex lg:flex-col lg:justify-start lg:min-w-[280px] lg:max-w-[320px] xl:max-w-[380px] space-y-4 xl:space-y-6">
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
          </div>

          {/* Desktop Center Panel - Canvas */}
          <div className="hidden lg:flex justify-center items-center h-full lg:mx-8 xl:mx-12">
            <Canvas
              selectedColor={selectedColor}
              onPixelUpdate={handlePixelUpdate}
            />
          </div>

          {/* Desktop Right Panel - Users */}
          <div className="hidden lg:flex lg:flex-col lg:justify-start lg:min-w-[280px] lg:max-w-[320px] xl:max-w-[380px] space-y-4 xl:space-y-6 overflow-hidden">
            {/* Info Panel */}
            <div className="monad-glass rounded-xl p-4 xl:p-6">
              <h3 className="text-base xl:text-lg font-semibold text-white mb-3 xl:mb-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-monad-primary rounded-full"></div>
                <span>How to Play</span>
              </h3>
              <ul className="text-xs xl:text-sm text-gray-300 space-y-2 xl:space-y-3">
                <li className="flex items-start space-x-2">
                  <span className="text-monad-primary">1.</span>
                  <span>Connect your wallet to Monad testnet</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-monad-primary">2.</span>
                  <span>Select your favorite color</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-monad-primary">3.</span>
                  <span>Click any pixel to paint it</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-monad-primary">4.</span>
                  <span>Create collaborative masterpieces!</span>
                </li>
              </ul>

              <div className="mt-4 xl:mt-6 pt-3 xl:pt-4 border-t border-white/10">
                <div className="text-xs text-gray-400">
                  <span className="text-monad-primary">⚡</span> Ultra-fast
                  transactions on Monad
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

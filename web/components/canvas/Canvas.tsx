'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWatchContractEvent,
  useWaitForTransactionReceipt,
} from 'wagmi';
import toast from 'react-hot-toast';
import { Pixel } from './Pixel';
import { CANVAS_CONTRACT, hexToColorInt, colorIntToHex } from '@/lib/contract';

interface PixelData {
  color: string;
  owner?: string;
}

interface CanvasProps {
  selectedColor: string;
  onPixelUpdate?: (x: number, y: number, color: string) => void;
}

export function Canvas({ selectedColor, onPixelUpdate }: CanvasProps) {
  const { isConnected } = useAccount();
  const [canvasSize, setCanvasSize] = useState({ width: 64, height: 64 });
  const [pixels, setPixels] = useState<PixelData[][]>([]);
  const [pendingPixels, setPendingPixels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Read canvas dimensions
  const { data: width } = useReadContract({
    ...CANVAS_CONTRACT,
    functionName: 'width',
  });

  const { data: height } = useReadContract({
    ...CANVAS_CONTRACT,
    functionName: 'height',
  });

  // Read all pixels at once
  const {
    data: allPixelsData,
    isLoading: isLoadingPixels,
    error: pixelsError,
    isError: isPixelsError,
    refetch: refetchPixels,
  } = useReadContract({
    ...CANVAS_CONTRACT,
    functionName: 'getAllPixels',
    query: {
      refetchInterval: false, // We'll handle manual refreshing
    },
  });

  // Write contract hook for drawing pixels
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Watch for pixel drawn events
  useWatchContractEvent({
    ...CANVAS_CONTRACT,
    eventName: 'PixelDrawn',
    onLogs(logs) {
      logs.forEach((log) => {
        const { x, y, color } = log.args;
        if (x !== undefined && y !== undefined && color !== undefined) {
          const pixelKey = `${x}-${y}`;
          setPixels((prev) => {
            const newPixels = [...prev];
            if (newPixels[y] && newPixels[y][x]) {
              newPixels[y] = [...newPixels[y]];
              newPixels[y][x] = { color: colorIntToHex(color) };
            }
            return newPixels;
          });
          // Remove from pending when confirmed on chain
          setPendingPixels((prev) => {
            const newSet = new Set(prev);
            newSet.delete(pixelKey);
            return newSet;
          });
        }
      });
    },
  });

  // Handle transaction state changes
  useEffect(() => {
    if (error) {
      setPendingPixels(new Set());
      toast.error('Transaction cancelled');
    }
  }, [error]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Pixel painted successfully!');
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (receiptError) {
      setPendingPixels(new Set());
      toast.error('Transaction failed');
    }
  }, [receiptError]);

  // Debug contract call states
  useEffect(() => {
    console.log('Contract call states:', {
      width: width?.toString(),
      height: height?.toString(),
      isLoadingPixels,
      isPixelsError,
      pixelsError: pixelsError?.message,
      allPixelsDataLength: allPixelsData
        ? Array.isArray(allPixelsData)
          ? allPixelsData.length
          : 'not array'
        : 'undefined',
    });
  }, [
    width,
    height,
    isLoadingPixels,
    isPixelsError,
    pixelsError,
    allPixelsData,
  ]);

  // Handle getAllPixels error - could mean function doesn't exist on deployed contract
  useEffect(() => {
    if (isPixelsError && pixelsError) {
      console.error('Error loading pixels:', pixelsError);

      // Check if it's a function not found error
      const errorMessage = pixelsError.message || '';
      if (
        errorMessage.includes('getAllPixels') ||
        errorMessage.includes('function selector')
      ) {
        console.warn(
          'getAllPixels function not found on contract - using empty canvas'
        );
        toast.error(
          'Contract does not have getAllPixels function - starting with empty canvas'
        );
      } else {
        toast.error('Failed to load canvas data from contract');
      }

      // Fall back to empty canvas if getAllPixels fails
      if (width && height) {
        const w = Number(width);
        const h = Number(height);
        setCanvasSize({ width: w, height: h });

        const newPixels = Array(h)
          .fill(null)
          .map(() =>
            Array(w)
              .fill(null)
              .map(() => ({ color: '#000000' }))
          );
        setPixels(newPixels);
        setIsLoading(false);
        setLoadingProgress(100);
      }
    }
  }, [isPixelsError, pixelsError, width, height]);

  // Initialize canvas when dimensions and pixel data are loaded
  useEffect(() => {
    if (
      width &&
      height &&
      allPixelsData !== undefined &&
      !isLoadingPixels &&
      !isPixelsError
    ) {
      const w = Number(width);
      const h = Number(height);
      setCanvasSize({ width: w, height: h });

      const isInitialLoad = isLoading;
      if (isInitialLoad) {
        console.log('Loading canvas state from getAllPixels()...');
        setLoadingProgress(50);
      } else {
        console.log('Refreshing canvas state from getAllPixels()...');
      }

      // Initialize canvas with data from getAllPixels()
      const newPixels = Array(h)
        .fill(null)
        .map(() =>
          Array(w)
            .fill(null)
            .map(() => ({ color: '#000000' }))
        );

      if (allPixelsData && Array.isArray(allPixelsData)) {
        let coloredPixelsCount = 0;
        console.log(`Processing ${allPixelsData.length} pixels from contract`);

        allPixelsData.forEach((colorInt, index) => {
          const x = index % w;
          const y = Math.floor(index / w);

          if (y < h && x < w) {
            const color =
              Number(colorInt) === 0
                ? '#000000'
                : colorIntToHex(Number(colorInt));
            newPixels[y][x] = { color };

            if (Number(colorInt) !== 0) {
              coloredPixelsCount++;
            }
          }
        });

        console.log(
          `${
            isInitialLoad ? 'Loaded' : 'Refreshed'
          } ${coloredPixelsCount} colored pixels from contract`
        );
      } else {
        console.log('allPixelsData is not an array or is empty');
      }

      setPixels(newPixels);

      if (isInitialLoad) {
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          console.log('Canvas state loaded from getAllPixels()');
        }, 200);
      } else {
        console.log('Canvas state refreshed from getAllPixels()');
      }
    }
  }, [width, height, allPixelsData, isLoadingPixels, isPixelsError, isLoading]);

  // Show loading state while contract data is being fetched
  useEffect(() => {
    if (isLoadingPixels) {
      setLoadingProgress(20);
    }
  }, [isLoadingPixels]);

  // Timeout fallback - if loading takes too long, fall back to empty canvas
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && width && height) {
        console.warn('Loading timeout - falling back to empty canvas');
        const w = Number(width);
        const h = Number(height);
        setCanvasSize({ width: w, height: h });

        const newPixels = Array(h)
          .fill(null)
          .map(() =>
            Array(w)
              .fill(null)
              .map(() => ({ color: '#000000' }))
          );
        setPixels(newPixels);
        setIsLoading(false);
        setLoadingProgress(100);
        toast.error('Loading took too long - started with empty canvas');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, width, height]);

  // Periodic refresh to keep canvas in sync (every 10 seconds)
  useEffect(() => {
    if (!isLoading && width && height) {
      const interval = setInterval(() => {
        console.log('Refreshing canvas state from contract...');
        refetchPixels();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isLoading, width, height, refetchPixels]);

  const getPixelKey = (x: number, y: number) => `${x}-${y}`;

  const handlePixelClick = useCallback(
    (x: number, y: number) => {
      if (!isConnected) {
        toast.error('Please connect your wallet first');
        return;
      }

      const pixelKey = getPixelKey(x, y);
      if (isPending || isConfirming) {
        return;
      }

      if (pendingPixels.has(pixelKey)) {
        return;
      }

      setPendingPixels((prev) => new Set(prev).add(pixelKey));

      const colorInt = hexToColorInt(selectedColor);

      writeContract({
        ...CANVAS_CONTRACT,
        functionName: 'drawPixel',
        args: [x, y, colorInt],
      });

      onPixelUpdate?.(x, y, selectedColor);
      toast.success(`Drawing pixel (${x}, ${y})...`);
    },
    [
      isConnected,
      selectedColor,
      isPending,
      isConfirming,
      writeContract,
      onPixelUpdate,
      pendingPixels,
    ]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-full p-2">
        <div className="monad-glass border border-white/20 shadow-2xl canvas-glow rounded-xl p-4 md:p-8 max-w-md mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-monad-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white text-sm text-center">
              Loading canvas with getAllPixels()...
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-monad-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="text-gray-300 text-xs">
              {loadingProgress}% loaded
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-full p-2">
      <div
        className="grid monad-glass border border-white/20 shadow-2xl canvas-glow rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${canvasSize.width}, minmax(0, 1fr))`,
          width: 'min(450px, calc(100vw - 2rem))',
          height: 'min(450px, calc(100vw - 2rem))',
          maxWidth: '450px',
          maxHeight: '450px',
          minWidth: 'min(280px, 90vw)',
          minHeight: 'min(280px, 90vw)',
          aspectRatio: '1',
        }}
      >
        {pixels.map((row, y) =>
          row.map((pixel, x) => {
            const pixelKey = getPixelKey(x, y);
            return (
              <Pixel
                key={pixelKey}
                x={x}
                y={y}
                color={pixel.color}
                isPending={pendingPixels.has(pixelKey)}
                onClick={handlePixelClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

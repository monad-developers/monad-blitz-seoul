declare module 'gifenc' {
  export interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: number[][];
        delay?: number;
        transparent?: boolean;
        dispose?: number;
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function GIFEncoder(): GIFEncoderInstance;

  export function quantize(
    data: Uint8ClampedArray,
    maxColors: number,
    options?: { format?: 'rgb565' | 'rgba4444' }
  ): number[][];

  export function applyPalette(
    data: Uint8ClampedArray,
    palette: number[][],
    format?: 'rgb565' | 'rgba4444'
  ): Uint8Array;
}

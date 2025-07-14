export const CANVAS_CONTRACT = {
  address: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    '0xDF791D824dB46530B964d7A9df30ED8bBB922f80') as `0x${string}`,
  abi: [
    {
      type: 'constructor',
      inputs: [
        {
          name: '_width',
          type: 'uint16',
          internalType: 'uint16',
        },
        {
          name: '_height',
          type: 'uint16',
          internalType: 'uint16',
        },
      ],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'drawPixel',
      inputs: [
        {
          name: 'x',
          type: 'uint16',
          internalType: 'uint16',
        },
        {
          name: 'y',
          type: 'uint16',
          internalType: 'uint16',
        },
        {
          name: 'color',
          type: 'uint24',
          internalType: 'uint24',
        },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'getPixel',
      inputs: [
        {
          name: 'x',
          type: 'uint16',
          internalType: 'uint16',
        },
        {
          name: 'y',
          type: 'uint16',
          internalType: 'uint16',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint24',
          internalType: 'uint24',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'height',
      inputs: [],
      outputs: [
        {
          name: '',
          type: 'uint16',
          internalType: 'uint16',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getAllPixels',
      inputs: [],
      outputs: [
        {
          name: '',
          type: 'uint24[]',
          internalType: 'uint24[]',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'pixels',
      inputs: [
        {
          name: 'index',
          type: 'uint32',
          internalType: 'uint32',
        },
      ],
      outputs: [
        {
          name: '',
          type: 'uint24',
          internalType: 'uint24',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'width',
      inputs: [],
      outputs: [
        {
          name: '',
          type: 'uint16',
          internalType: 'uint16',
        },
      ],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'PixelDrawn',
      inputs: [
        {
          name: 'user',
          type: 'address',
          indexed: true,
          internalType: 'address',
        },
        {
          name: 'x',
          type: 'uint16',
          indexed: false,
          internalType: 'uint16',
        },
        {
          name: 'y',
          type: 'uint16',
          indexed: false,
          internalType: 'uint16',
        },
        {
          name: 'color',
          type: 'uint24',
          indexed: false,
          internalType: 'uint24',
        },
      ],
      anonymous: false,
    },
  ] as const,
};

export function hexToColorInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function colorIntToHex(colorInt: number): string {
  return `#${colorInt.toString(16).padStart(6, '0')}`;
}


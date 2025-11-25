import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          dirt: '#8B4513',
          grass: '#7CBE3C',
          stone: '#7F7F7F',
          wood: '#9C6B3E',
        },
      },
    },
  },
  plugins: [],
};

export default config;

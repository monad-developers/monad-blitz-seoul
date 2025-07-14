import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        monad: {
          primary: "#6c54f8",
          light: "#8b6ffb",
          dark: "#4f3cd4",
          bg: "#0a0a0f",
        },
      },
      backgroundImage: {
        'monad-gradient': 'linear-gradient(135deg, #6c54f8 0%, #8b6ffb 100%)',
        'monad-bg': 'linear-gradient(135deg, #0a0a0f 0%, #1a1628 50%, #2a1a3f 70%, #0a0a0f 100%)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
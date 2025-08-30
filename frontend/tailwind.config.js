/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 다크모드 활성화
  theme: {
    extend: {
      colors: {
        // 커스텀 색상 (필요시)
        'monad-purple': {
          500: '#8B5CF6',
          600: '#7C3AED'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      gridTemplateColumns: {
        '21': 'repeat(21, minmax(0, 1fr))',
        '25': 'repeat(25, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}
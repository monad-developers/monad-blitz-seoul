export const colors = {
  background: {
    primary: '#121619',
    secondary: '#1a1f24',
    tertiary: '#232a30',
    card: '#1e2429',
  },
  primary: {
    main: '#5AD8CC',
    light: '#7DE3D9',
    dark: '#45A89F',
    contrast: '#121619',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B8BFC6',
    tertiary: '#8B9299',
    disabled: '#5A6269',
  },
  status: {
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
  },
  monster: {
    eth: '#627EEA',
    btc: '#F7931A',
    ethGlow: 'rgba(98, 126, 234, 0.3)',
    btcGlow: 'rgba(247, 147, 26, 0.3)',
  },
  border: {
    default: '#2A3238',
    active: '#5AD8CC',
    hover: '#3A434A',
  },
};

export const typography = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',  // 2px
  base: '0.25rem', // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  glow: {
    primary: `0 0 20px rgba(90, 216, 204, 0.5)`,
    eth: `0 0 30px rgba(98, 126, 234, 0.6)`,
    btc: `0 0 30px rgba(247, 147, 26, 0.6)`,
  },
};

export const transitions = {
  fast: 'all 0.15s ease',
  base: 'all 0.3s ease',
  slow: 'all 0.5s ease',
};

export const animations = {
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(90, 216, 204, 0.5); }
      50% { box-shadow: 0 0 40px rgba(90, 216, 204, 0.8); }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
};
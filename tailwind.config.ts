import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce7fd',
          200: '#c0d3fc',
          300: '#94b4fa',
          400: '#618df6',
          500: '#3b6cf3',
          600: '#2553e8',
          700: '#1d41d5',
          800: '#1e37ac',
          900: '#1e3188',
          950: '#131f4d',
        },
        navy: {
          DEFAULT: '#0b2545',
          800: '#102a4c',
          700: '#13315c',
          600: '#1b3a6b',
        },
        success: colors.emerald,
        danger: colors.red,
        warning: colors.amber,
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.05)',
        pop: '0 12px 32px -8px rgb(15 23 42 / 0.18)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(1.3)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
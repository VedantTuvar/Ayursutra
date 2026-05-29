import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0faf4',
          100: '#ddf7e7',
          200: '#bceecf',
          300: '#8bdda7',
          400: '#55c77e',
          500: '#2fa95c',
          600: '#208b49',
          700: '#145c32', // Perfect forest green matching the logo
          800: '#114a2a',
          900: '#0e3e23',
        },
        slate: {
          950: '#0f172a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(15, 23, 42, 0.08)'
      }
    },
  },
  plugins: [],
} satisfies Config;

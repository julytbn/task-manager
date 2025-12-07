import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kekeli Group - luxury palette
        black: {
          DEFAULT: '#000000',
          900: '#111111',
        },
        gold: {
          DEFAULT: '#D4AF37',
          bright: '#FFD700',
          shade: '#C9A227',
        },
        offwhite: '#F8F9FA',
        anthracite: '#333333',
        // utility colors
        background: '#F8F9FA',
        surface: '#FFFFFF',
        textPrimary: '#000000',
        textMuted: '#666666',
        border: '#E0E0E0',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(2,6,23,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
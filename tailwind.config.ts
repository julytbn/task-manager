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
        primary: '#0A66C2',
        primaryLight: '#1A91F0',
        primaryHover: '#05509A',
        success: '#2ECC71',
        warning: '#F1C40F',
        danger: '#E74C3C',
        background: '#F4F7FA',
        surface: '#F0F4F8',
        text: '#1E1E1E',
        muted: '#5A6A80',
        border: '#DCE3EB',
        // keep existing font family ext
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
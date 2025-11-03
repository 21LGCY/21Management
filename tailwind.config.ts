import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6', // purple
          dark: '#7C3AED',
          light: '#A78BFA',
        },
        secondary: {
          DEFAULT: '#EC4899', // pink
          dark: '#DB2777',
          light: '#F9A8D4',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          lighter: '#1A1A1A',
          card: '#141414',
        },
      },
    },
  },
  plugins: [],
}
export default config

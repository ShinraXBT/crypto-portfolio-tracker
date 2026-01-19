import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gain: '#22c55e',
        loss: '#ef4444',
        neutral: '#3b82f6',
        header: '#1e40af'
      }
    },
  },
  plugins: [],
}

export default config

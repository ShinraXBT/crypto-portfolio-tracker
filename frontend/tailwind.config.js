/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
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

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        impact: ['Impact', 'Arial Black', 'sans-serif'],
      },
      colors: {
        'killer-red': '#e74c3c',
        'killer-green': '#2ecc71',
        'killer-purple': '#9b59b6',
        'killer-blue': '#3498db',
        'glass-bg': 'rgba(15,15,15,0.7)',
      },
    },
  },
  plugins: [],
}

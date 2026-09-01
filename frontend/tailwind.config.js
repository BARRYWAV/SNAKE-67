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
        'killer-red': '#CF010B',
        'killer-green': '#2ecc71',
        'killer-purple': '#9b59b6',
        'killer-blue': '#3498db',
        'glass-bg': 'rgba(15,15,15,0.7)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(2)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        fadeOut: 'fadeOut 1s forwards ease-in',
      },
    },
  },
  plugins: [],
}

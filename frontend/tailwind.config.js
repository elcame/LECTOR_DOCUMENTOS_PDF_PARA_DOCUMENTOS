/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4b8fc',
          400: '#8190f8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4751b0',
          800: '#3d4491',
          900: '#373d75',
        },
      },
    },
  },
  plugins: [],
}

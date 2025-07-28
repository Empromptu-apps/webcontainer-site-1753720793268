/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce5cd',
          300: '#8dd1a8',
          400: '#57b67c',
          500: '#2c5530',
          600: '#1f4025',
          700: '#1a331f',
          800: '#16291b',
          900: '#132218',
        }
      }
    },
  },
  plugins: [],
}

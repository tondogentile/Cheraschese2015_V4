/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FBF4DB',
          100: '#F8EBB7',
          200: '#F2D86F',
          300: '#ECC52C',
          400: '#D4AF37',
          500: '#B89A2A',
          600: '#9C841E',
          700: '#806E13',
          800: '#645807',
          900: '#483F00',
        },
      },
    },
  },
  plugins: [],
};

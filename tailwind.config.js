/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik-Regular', 'sans-serif'],
        'rubik-bold': ['Rubik-Bold', 'sans-serif'],
        'rubik-extrabold': ['Rubik-ExtraBold', 'sans-serif'],
        'rubik-medium': ['Rubik-Medium', 'sans-serif'],
        'rubik-semibold': ['Rubik-SemiBold', 'sans-serif'],
        'rubik-light': ['Rubik-Light', 'sans-serif'],
      },
      colors: {
        primary: {
          100: '#699cf50a',
          200: '#699cf51a',
          300: '#2867d3',
          400: '#699cf5',
          500: '#2368fd',
        },
        secondary: '#fcb314',
        accent: {
          100: '#fbfbfd',
        },
        black: {
          default: '#000000',
          100: '#8c8e98',
          200: '#666876',
          300: '#191d31',
        },
        danger: '#f75555',
      },
    },
  },
  plugins: [],
};

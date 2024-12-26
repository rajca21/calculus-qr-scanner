/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#699cf50a',
          200: '#699cf51a',
          300: '#2867d3',
          500: '#699cf5',
        },
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

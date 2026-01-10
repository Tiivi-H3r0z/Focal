/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dae7',
          300: '#a7bbd1',
          400: '#7897b8',
          500: '#567aa0',
          600: '#426085',
          700: '#364e6c',
          800: '#2f425a',
          900: '#2b3a4c',
          950: '#1c2633',
        },
      },
    },
  },
  plugins: [],
}

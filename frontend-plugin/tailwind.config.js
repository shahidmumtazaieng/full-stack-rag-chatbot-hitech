/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#E30613',
          600: '#c0050f',
          700: '#a0040e',
        },
        secondary: {
          50: '#f0f9ff',
          500: '#003087',
          600: '#002d6b',
          700: '#00255a',
        },
      },
    },
  },
  plugins: [],
}
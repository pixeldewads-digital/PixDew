/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'pixel-mint': '#7FFFD4',
        'pixel-blue': '#87CEEB',
        'pixel-teal': '#40E0D0',
        'pixel-cyan': '#00CED1',
        'pixel-light': '#F0FFFF',
      }
    },
  },
  plugins: [],
}

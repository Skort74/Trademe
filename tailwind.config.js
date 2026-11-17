/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        plusJakartaSans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        trade: {
          50: '#F2F8F5',
          100: '#E5F2EC',
          200: '#CCE5D9',
          500: '#286E4F',
          600: '#225E43',
          700: '#1B4D37',
          800: '#143C2B',
          900: '#0E2A1E',
          gold: '#F6C654',
          dark: '#1F2A24',
          muted: '#7A8780',
          border: '#DCE5DF',
          bg: '#F6FAF7',
        },
      },
    },
  },
  plugins: [],
};
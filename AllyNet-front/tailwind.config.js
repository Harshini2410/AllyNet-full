/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F7F5',
          100: '#E9EFEA',
          200: '#C8D8CC',
          300: '#A7C1AE',
          400: '#86AA90',
          500: '#7D9D85', // Brand Primary
          600: '#637E6A',
          700: '#4A5E4F',
          800: '#313F35',
          900: '#181F1A',
        },
        sand: {
          50: '#FCFBF9',
          100: '#F9F7F2', // Brand Background
          200: '#F0EBE0',
          300: '#E7DFCE',
          400: '#DDD3BC',
          500: '#D4C7AA',
          600: '#AA9F88',
          700: '#807766',
          800: '#554F44',
          900: '#2B2822',
        },
        coral: {
          50: '#FDF3F3',
          100: '#FBE7E7',
          200: '#F7CFCF',
          300: '#F3B7B7',
          400: '#EF9F9F',
          500: '#E68A8C', // Brand SOS/Alert
          600: '#B86E70',
          700: '#8A5354',
          800: '#5C3738',
          900: '#2E1C1C',
        },
        amber: {
          50: '#FEFBF3',
          100: '#FDF7E7',
          200: '#F9ECC8',
          300: '#F5E1A9',
          400: '#F1D68A',
          500: '#D9A05B', // Brand Help/Warning
          600: '#AE8049',
          700: '#826037',
          800: '#574024',
          900: '#2B2012',
        },
        charcoal: {
          50: '#E9EAEA',
          100: '#D4D6D6',
          200: '#A9ADAD',
          300: '#7E8484',
          400: '#535B5B',
          500: '#2C3333', // Brand Text
          600: '#232929',
          700: '#1A1F1F',
          800: '#111414',
          900: '#090A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f7fa',
          100: '#e9edf3',
          200: '#cdd6e2',
          300: '#a3b2c7',
          400: '#7186a4',
          500: '#516685',
          600: '#3d4f6b',
          700: '#303e56',
          800: '#242f42',
          900: '#171e2c',
          950: '#0d1118',
        },
        accent: {
          50: '#eefcf6',
          100: '#d4f7e7',
          200: '#aaeed3',
          300: '#73dfb9',
          400: '#3dc89b',
          500: '#1aab80',
          600: '#0f8a68',
          700: '#0f6e56',
          800: '#105846',
          900: '#0f493b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(13 17 24 / 0.04), 0 1px 3px 0 rgb(13 17 24 / 0.08)',
        card: '0 2px 8px 0 rgb(13 17 24 / 0.06), 0 1px 2px 0 rgb(13 17 24 / 0.04)',
      },
    },
  },
  plugins: [],
};

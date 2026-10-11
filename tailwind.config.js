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
        // "Cyber forensics" dark theme, used only by the new tools-platform
        // sections/pages added below the original (preserved) light-themed
        // Remove AI Metadata tool - applied directly, not via Tailwind's
        // dark: variant, since it's a deliberate section design, not an
        // OS-preference dark mode.
        cyber: {
          50: '#eef1f4',
          100: '#c5ccd3',
          200: '#99a3ae',
          300: '#6b7684',
          400: '#4a5563',
          500: '#2e3844',
          600: '#232c38',
          700: '#1a212b',
          800: '#11161d',
          900: '#0b0f14',
          950: '#05070a',
        },
        neon: {
          50: '#e6fff2',
          100: '#b3ffdb',
          200: '#80ffc4',
          300: '#4dffad',
          400: '#26ff9b',
          500: '#00ff88',
          600: '#00cc6d',
          700: '#009952',
          800: '#006636',
          900: '#00331b',
        },
        wire: {
          50: '#e6f9ff',
          100: '#b3ecff',
          200: '#80dfff',
          300: '#4dd2ff',
          400: '#26c7ff',
          500: '#00bfff',
          600: '#0099cc',
          700: '#007399',
          800: '#004d66',
          900: '#002633',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(13 17 24 / 0.04), 0 1px 3px 0 rgb(13 17 24 / 0.08)',
        card: '0 2px 8px 0 rgb(13 17 24 / 0.06), 0 1px 2px 0 rgb(13 17 24 / 0.04)',
        'glow-green': '0 0 0 1px rgb(0 255 136 / 0.4), 0 0 16px 0 rgb(0 255 136 / 0.25)',
        'glow-blue': '0 0 0 1px rgb(0 191 255 / 0.4), 0 0 16px 0 rgb(0 191 255 / 0.25)',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        scanline: 'scanline 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

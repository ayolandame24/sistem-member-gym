/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdfff',
          300: '#8ecbff',
          400: '#59adff',
          500: '#328bff',
          600: '#1b6cf5',
          700: '#1456e1',
          800: '#1747b6',
          900: '#193f8f',
          950: '#142755',
        },
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#dee2ea',
          300: '#c5cbd8',
          400: '#9ba3b5',
          500: '#737d94',
          600: '#5a6478',
          700: '#475066',
          800: '#2e3548',
          900: '#1c2233',
          950: '#0f1320',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 16px -2px rgba(16, 24, 40, 0.10), 0 2px 6px -1px rgba(16, 24, 40, 0.06)',
        pop: '0 12px 32px -4px rgba(16, 24, 40, 0.18), 0 4px 12px -2px rgba(16, 24, 40, 0.08)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.18s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

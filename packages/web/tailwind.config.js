/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1F2E',
          deep: '#111E2E',
        },
        orange: {
          DEFAULT: '#F3A261',
          light: '#FEF0E6',
        },
        teal: {
          DEFAULT: '#00A996',
          dark: '#007A6E',
          light: '#E6F6F4',
        },
        'content-bg': '#F7F8FA',
        'body-text': '#1C2B3A',
        'muted-text': '#5A6A7A',
        'card-border': '#DDE2E8',
      },
      fontFamily: {
        georgia: ['Georgia', 'serif'],
        lato: ['Lato', 'Calibri', 'sans-serif'],
      },
      letterSpacing: {
        'section': '4px',
      },
    },
  },
  plugins: [],
};

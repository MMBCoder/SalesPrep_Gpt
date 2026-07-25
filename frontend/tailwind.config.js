/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'sans-serif'] },
      colors: {
        primary: '#1D6A4A',
        'primary-light': '#D4EDE1',
        dark: '#111111',
        'dark-alt': '#1A1A1A',
        'gray-label': '#6B7280',
        'gray-border': '#E5E7EB',
        'input-bg': '#F2F2F2',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kea: {
          blue: '#1a3a6b',
          orange: '#e67e22',
          light: '#eef3fb',
        },
      },
    },
  },
  plugins: [],
}


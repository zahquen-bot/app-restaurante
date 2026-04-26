/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Isso permite alternar ativando uma classe 'dark' no elemento pai
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
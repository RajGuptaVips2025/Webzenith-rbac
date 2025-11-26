/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // 👇 ADD THIS LINE. Adjust path if your UI components are in 'src' or 'components'
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}", 
    "../../packages/ui/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

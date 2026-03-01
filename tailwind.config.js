/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
          700: "#4d7c0f",
          800: "#3f6212",
          900: "#365314",
        },
        surface: {
          DEFAULT: "#141414",
          50: "#1a1a1a",
          100: "#1e1e1e",
          200: "#252525",
          300: "#2a2a2a",
          400: "#333333",
        },
      },
    },
  },
  plugins: [],
};

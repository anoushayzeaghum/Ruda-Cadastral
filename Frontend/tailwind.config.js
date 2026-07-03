/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",  
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a5f",
          hover: "#172d4a",
          light: "#f5f6f8",
        },
        accent: {
          DEFAULT: "#6fc04f",
          hover: "#5aa83e",
        },
        text: "#1a1a2e",
        bg: "#f5f6f8",
      },
    },
  },
  plugins: [],
};

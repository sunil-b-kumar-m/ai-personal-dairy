/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          900: "#0f172a",
          800: "#1e3a5f",
          700: "#1e40af",
          accent: "#38bdf8",
          violet: "#818cf8",
        },
      },
    },
  },
  plugins: [],
};

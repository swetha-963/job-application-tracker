/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102b2b",
        ocean: "#0c7673",
        mint: "#e5f5ed",
        paper: "#f7f9f8",
      },
      boxShadow: {
        card: "0 14px 42px rgba(17, 42, 41, 0.07)",
      },
    },
  },
  plugins: [],
};

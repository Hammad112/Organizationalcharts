import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Pulled directly from the existing HUM AI Lab deck
        brand: {
          red: "#990011",
          maroon: "#5C000A",
          gold: "#C9A227",
          navy: "#2F3C7E",
          ink: "#1F1A1B",
          slate: "#6B5E60",
          cream: "#FCF6F5",
          blush: "#F3DCDA",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 26, 27, 0.06)",
        lift: "0 8px 24px rgba(31, 26, 27, 0.10)",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(12px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "toast-in": {
          "0%": { transform: "translateY(16px) scale(0.95)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "toast-out": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(16px) scale(0.95)", opacity: "0" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.22s ease-out",
        "fade-up": "fade-up 0.28s ease-out",
        "toast-in": "toast-in 0.22s ease-out",
        "toast-out": "toast-out 0.18s ease-in forwards",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

/**
 * CRI design tokens.
 * Professional B2B "risk intelligence" palette: off-white canvas, military
 * green primary, amber warning accents, steel grey metadata.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cri: {
          bg: "#F7F8F4",
          green: "#344E41",
          "green-dark": "#293E33",
          "green-light": "#4A6B58",
          charcoal: "#1F2933",
          steel: "#6B7280",
          amber: "#D99A21",
          "amber-dark": "#B27C14",
          "amber-light": "#FBF1DD",
          border: "#E5E7EB",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(31, 41, 51, 0.04), 0 1px 3px 0 rgba(31, 41, 51, 0.06)",
        "card-hover": "0 4px 12px -2px rgba(31, 41, 51, 0.10)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;

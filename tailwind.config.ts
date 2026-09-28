import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1C3763",
          dark: "#0E1B33",
          light: "#254480",
        },
        accent: {
          DEFAULT: "#C79A56",
          dark: "#9C7538",
        },
        surface: {
          DEFAULT: "#F1EBDD",
          alt: "#E8E0CC",
        },
        border: "#DDD2B8",
        text: {
          DEFAULT: "#1E1A12",
          muted: "#5B5643",
        },
      },
      fontFamily: {
        display: ["Big Shoulders Display", "Arial Narrow", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "1280px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(28, 55, 99, 0.08)",
        "card-hover": "0 8px 24px rgba(28, 55, 99, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;

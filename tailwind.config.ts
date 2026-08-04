import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        primary: "var(--color-primary)",
        line: "var(--color-line)",
        error: "var(--color-error)",
      },
      fontFamily: {
        // Nur eine Schriftart im gesamten Projekt.
        serif: ["var(--font-instrument-serif)", "Georgia", '"Times New Roman"', "serif"],
        sans: ["var(--font-instrument-serif)", "Georgia", '"Times New Roman"', "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

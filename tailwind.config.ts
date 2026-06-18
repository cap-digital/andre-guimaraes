import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidade visual Grupo André Guimarães
        navy: {
          DEFAULT: "#0A0F2D",
          800: "#10173A",
          700: "#161C43",
          600: "#1E2657",
        },
        brand: {
          DEFAULT: "#175A97",
          50: "#EEF4FB",
          100: "#D7E6F5",
          200: "#A9C8E8",
          300: "#7AAADB",
          400: "#4C8CCE",
          500: "#175A97",
          600: "#124A7E",
          700: "#0E3B65",
          800: "#0A2B4B",
        },
        cyan: {
          DEFAULT: "#10AFE0",
          light: "#5BCBEC",
        },
        ink: "#0D121A",
        muted: "#4E565F",
        line: "#E6E8EC",
        canvas: "#F4F6FA",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(13,18,26,0.04), 0 8px 24px rgba(13,18,26,0.06)",
        pop: "0 12px 40px rgba(13,18,26,0.16)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;

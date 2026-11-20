import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cinova: {
          bg: "#080506",
          secondary: "#10080C",
          nav: "#0B0508",
          surface: "#160B10",
          elevated: "#1D0C13",
          card: "#160B10",
          cardHover: "#1D0C13",
          maroon: "#650A20",
          crimson: "#A30D32",
          border: "rgba(155, 25, 57, 0.22)",
          borderLight: "rgba(225, 29, 72, 0.38)",
          primary: "#E11D48",
          secondaryAccent: "#FF385B",
          textPrimary: "#F5F1F3",
          textSecondary: "#AAA0A7",
          muted: "#746971",
          glow: "rgba(163, 13, 50, 0.30)",
          accent: {
            DEFAULT: "#E11D48",
            light: "#FF385B",
            dark: "#A30D32",
            maroon: "#650A20",
            glow: "rgba(163, 13, 50, 0.30)",
          },
        },
        netflix: {
          red: "#E11D48",
          redDark: "#A30D32",
          redGlow: "rgba(163, 13, 50, 0.4)",
          black: "#080506",
          darker: "#050304",
          card: "#160B10",
          cardHover: "#1D0C13",
          border: "rgba(155, 25, 57, 0.22)",
          gray: "#AAA0A7",
          lightGray: "#F5F1F3",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "cinova-gradient": "linear-gradient(180deg, rgba(8, 5, 6, 0.15) 0%, rgba(8, 5, 6, 0.85) 68%, #080506 100%)",
        "cinova-hero": "linear-gradient(90deg, rgba(8, 5, 6, 0.96) 0%, rgba(16, 8, 12, 0.72) 48%, rgba(8, 5, 6, 0.12) 100%)",
        "netflix-hero-vignette": "linear-gradient(77deg, rgba(8, 5, 6, 0.94) 0%, rgba(16, 8, 12, 0.6) 50%, rgba(8, 5, 6, 0.1) 100%)",
        "netflix-bottom-fade": "linear-gradient(180deg, transparent 0%, rgba(8, 5, 6, 0.65) 62%, #080506 100%)",
      },
      boxShadow: {
        "cinova": "0 8px 28px -4px rgba(0, 0, 0, 0.85), 0 0 20px -6px rgba(163, 13, 50, 0.24)",
        "cinova-glow": "0 0 24px -4px rgba(225, 29, 72, 0.35)",
        "cinova-card": "0 10px 26px rgba(0, 0, 0, 0.65)",
        "cinova-hover": "0 12px 30px rgba(0, 0, 0, 0.75), 0 0 18px -4px rgba(163, 13, 50, 0.32)",
        "netflix": "0 4px 24px rgba(0, 0, 0, 0.85)",
        "netflix-red": "0 0 24px -4px rgba(163, 13, 50, 0.45)",
        "netflix-card": "0 8px 24px rgba(8, 5, 6, 0.9)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "modal-in": "modalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "hero-fade": "heroFade 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        heroFade: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

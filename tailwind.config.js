/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f4ecdc",
        ink: "#211c17",
        "ink-soft": "#4b4338",
        "ink-faint": "#8a7d6c",
        cinnabar: "#a5382a",
        "cinnabar-deep": "#7f2a20",
        moss: "#5a6650",
      },
      fontFamily: {
        serif: [
          '"Noto Serif SC"',
          '"Source Han Serif SC"',
          '"Songti SC"',
          '"STSong"',
          '"SimSun"',
          "serif",
        ],
        kai: ['"Kaiti SC"', '"KaiTi"', '"STKaiti"', '"Noto Serif SC"', "serif"],
      },
      boxShadow: {
        scroll: "0 1px 0 rgba(33,28,23,0.06), 0 18px 40px -28px rgba(33,28,23,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.35)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        breathe: "breathe 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

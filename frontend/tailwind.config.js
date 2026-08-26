/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens for the "official notice board" identity
        ridge: "#1F3A5F",     // deep Himalayan slate blue - headers, links
        ridgeDark: "#152A47", // hover/active state
        paper: "#EDEAE1",     // stone/paper background (not cream)
        ink: "#26241F",       // body text, near-black warm
        marigold: "#D98E04",  // saffron accent - primary CTA / JOB tag
        pine: "#2F4F3E",      // secondary accent - RESULT tag
        rust: "#9B3B2E",      // ADMIT_CARD / urgent tag
        stone: "#C9C3B4",     // hairlines, dividers
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
      },
    },
  },
  plugins: [],
};

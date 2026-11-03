/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        "surface-2": token("surface-2"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        accent: token("accent"),
        "accent-ink": token("accent-ink"),
        "accent-soft": token("accent-soft"),
        danger: token("danger"),
        warn: token("warn"),
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(0 0 0 / 0.04)",
        sheet: "0 -8px 40px rgb(0 0 0 / 0.18)",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "pop-in": { from: { opacity: 0, transform: "scale(.96)" }, to: { opacity: 1, transform: "scale(1)" } },
      },
      animation: {
        "slide-up": "slide-up .25s cubic-bezier(.2,.8,.2,1)",
        "fade-in": "fade-in .2s ease-out",
        "pop-in": "pop-in .2s ease-out",
      },
    },
  },
  plugins: [],
};

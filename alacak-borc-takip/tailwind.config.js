/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Semantic theme tokens driven by CSS variables (see src/index.css) */
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--c-surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--c-surface-3) / <alpha-value>)",
        line: "rgb(var(--c-border) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",

        /* Fixed financial palette */
        brand: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          50: "rgb(var(--c-brand-50) / <alpha-value>)",
          100: "rgb(var(--c-brand-100) / <alpha-value>)",
          500: "rgb(var(--c-brand-500) / <alpha-value>)",
          600: "rgb(var(--c-brand-600) / <alpha-value>)",
          700: "rgb(var(--c-brand-700) / <alpha-value>)",
        },
        /* Elite gold — premium vurgular (aksandan bağımsız sabit) */
        gold: {
          DEFAULT: "#C9A227",
          light: "#E8C766",
          dark: "#A6841A",
          soft: "#FBF6E4",
          softdark: "#33290a",
        },
        receivable: {
          DEFAULT: "#10B981",
          soft: "#ECFDF5",
          softdark: "#052e26",
          dark: "#059669",
        },
        payable: {
          DEFAULT: "#EF4444",
          soft: "#FEF2F2",
          softdark: "#3a1114",
          dark: "#DC2626",
        },
        amber: {
          DEFAULT: "#F59E0B",
          soft: "#FFFBEB",
          softdark: "#3a2c05",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        /* Katmanlı yükselti — CSS değişkenleriyle tema ile değişir (src/index.css) */
        card: "var(--elev-1)",
        "card-hover": "var(--elev-2)",
        pop: "var(--elev-3)",
        "inner-line": "inset 0 0 0 1px rgb(var(--c-border))",
        glow: "0 0 0 1px rgb(var(--c-brand) / 0.25), 0 22px 48px -20px rgb(var(--c-brand) / 0.5)",
      },
      backgroundImage: {
        "brand-fade": "radial-gradient(120% 80% at 50% 0%, rgb(var(--c-brand) / 0.14), transparent 62%)",
        gold: "linear-gradient(120deg, #efd88a, #c9a227 55%, #a6841a)",
        sheen: "linear-gradient(100deg, transparent, rgb(255 255 255 / 0.28), transparent)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.96)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
        "gradient-pan": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.28s cubic-bezier(0.16,1,0.3,1)",
        "sheet-up": "sheet-up 0.32s cubic-bezier(0.16,1,0.3,1)",
        "slide-in-right": "slide-in-right 0.32s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scale-in 0.18s cubic-bezier(0.16,1,0.3,1)",
        float: "float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite",
        sheen: "sheen 3.4s ease-in-out infinite",
        "gradient-pan": "gradient-pan 9s ease infinite",
      },
    },
  },
  plugins: [],
};

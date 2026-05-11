import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fef9ed",
          dim: "#dedace",
          bright: "#fef9ed",
          "container-lowest": "#ffffff",
          "container-low": "#f8f3e7",
          container: "#f2ede2",
          "container-high": "#ede8dc",
          "container-highest": "#e7e2d6",
          variant: "#e7e2d6"
        },
        "on-surface": {
          DEFAULT: "#1d1c15",
          variant: "#584239"
        },
        outline: {
          DEFAULT: "#8b7267",
          variant: "#dfc0b4"
        },
        primary: {
          DEFAULT: "#a23f00",
          container: "#e86d2d",
          fixed: "#ffdbcc",
          "fixed-dim": "#ffb595"
        },
        "on-primary": {
          DEFAULT: "#ffffff",
          container: "#4d1a00",
          fixed: "#351000",
          "fixed-variant": "#7c2e00"
        },
        secondary: {
          DEFAULT: "#39693b",
          container: "#b8edb3",
          fixed: "#baf0b6",
          "fixed-dim": "#9fd49b"
        },
        "on-secondary": {
          DEFAULT: "#ffffff",
          container: "#3e6d3e",
          fixed: "#002105",
          "fixed-variant": "#215025"
        },
        tertiary: {
          DEFAULT: "#79573f",
          container: "#b1896e",
          fixed: "#ffdcc6",
          "fixed-dim": "#eabda0"
        },
        "on-tertiary": {
          DEFAULT: "#ffffff",
          container: "#3e2410",
          fixed: "#2d1604",
          "fixed-variant": "#5f402a"
        },
        danger: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          text: "#93000a"
        },
        leaf: {
          50: "#eefbf3",
          100: "#d7f4e2",
          600: "#16945a",
          700: "#127849"
        },
        ink: "#1b2430",
        paper: "#fef9ed",
        "paper-line": "#ecd6c8"
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        paper: "0 4px 12px rgba(111, 78, 55, 0.08)",
        label: "2px 3px 0 rgba(121, 87, 63, 0.22)"
      },
      backgroundImage: {
        "paper-texture":
          "radial-gradient(circle at 1px 1px, rgba(121,87,63,0.08) 1px, transparent 0)",
        "recipe-lines": "linear-gradient(to bottom, transparent 31px, rgba(223,192,180,0.75) 32px)"
      }
    }
  },
  plugins: []
};

export default config;

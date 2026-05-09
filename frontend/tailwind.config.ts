import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#eefbf3",
          100: "#d7f4e2",
          600: "#16945a",
          700: "#127849"
        },
        ink: "#1b2430"
      }
    }
  },
  plugins: []
};

export default config;

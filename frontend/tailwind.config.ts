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
        meridian: {
          green: "#163028",
          "green-soft": "#1f4034",
          gold: "#BE9B5C",
          "gold-soft": "#d4b577",
          cream: "#E2DACE",
          "cream-light": "#F5F3EE",
          body: "#2D3B30",
          muted: "#8A9088",
        },
      },
    },
  },
  plugins: [],
};
export default config;

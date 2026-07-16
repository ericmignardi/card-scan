/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#090d16",        // Deep obsidian blue/grey
        "background-card": "#131927", // Lighter grey for card items
        foreground: "#f8fafc",        // Near white
        "foreground-muted": "#94a3b8", // Cool grey
        primary: "#3b82f6",           // Electric blue
        secondary: "#475569",         // Slate grey
        accent: "#14b8a6",            // Neon scan teal
        border: "#1e293b",            // Subtle border grey
        rookie: "#eab308",            // Gold Rookie badge
        hof: "#b45309",               // Bronze plaque Hall of Fame badge
      },
    },
  },
  plugins: [],
};

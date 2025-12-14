/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand
        accent: "#FAB300",
        
        // Light Mode
        light: {
          bg: "#FFFFFF",
          card: "#FFFFFF",
          text: "#000000",
          textSecondary: "#6B6B6B",
          border: "#EAEAEA",
        },
        
        // Dark Mode
        dark: {
          bg: "#0E0E0E",
          card: "#141414",
          text: "#FFFFFF",
          textSecondary: "#A0A0A0",
          border: "#1E1E1E",
        },
        
        // Status
        success: "#2ECC71",
        missed: "#E74C3C",
        
        // Logo color
        slate: "#1E293B",
      },
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "title": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
        "section": ["17px", { lineHeight: "1.4", fontWeight: "500" }],
        "body": ["15px", { lineHeight: "1.5", fontWeight: "400" }],
        "meta": ["13px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      borderRadius: {
        button: "8px",
        card: "12px",
      },
      spacing: {
        "0.5": "4px",
        "1": "8px",
        "1.5": "12px",
        "2": "16px",
        "2.5": "20px",
        "3": "24px",
        "4": "32px",
        "5": "40px",
        "6": "48px",
      },
    },
  },
  plugins: [],
};

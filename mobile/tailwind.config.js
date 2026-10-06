/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        tunnel: {
          // Base
          primary: "#1F3A5F",
          accent: "#1F3A5F",
          text: "#2E2E2E",
          muted: "#94A3B8",
          bg: "#F4F6F8",
          surface: "#FFFFFF",
          secondary: "#616161",
          border: "#E0E0E0",
          divider: "#BDBDBD",

          // Sémantiques
          success: "#2E7D32",
          warning: "#ED6C02",
          danger: "#C62828",

          // Sidebar (dark)
          "sidebar-bg": "#2E2E2E",
          "sidebar-text": "#E5E9EF",
          "sidebar-muted": "#A0A8B5",
          "sidebar-active": "#3B4F70",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        badge: "3px",
        btn: "4px",
        card: "4px",
        input: "6px",
        notif: "8px",
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(31, 58, 95, 0.10)",
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
        modal: "0 4px 16px rgba(0, 0, 0, 0.15)",
      },
      transitionDuration: {
        fast: "100ms",
        DEFAULT: "150ms",
      },
      fontSize: {
        h1: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h2: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        h3: ["17.6px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        badge: ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
};

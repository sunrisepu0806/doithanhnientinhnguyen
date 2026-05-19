import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tông màu chủ đạo mềm mại
        brand: {
          primary: "#6366f1", // Indigo soft
          secondary: "#94a3b8",
          background: "#f8fafc",
        },
      },
      borderRadius: {
        // Bo tròn cực mạnh theo yêu cầu của bạn
        'soft': '2rem',
        'super': '3rem',
      },
      boxShadow: {
        // Đổ bóng cực mềm, không bị gắt
        'soft-xl': '0 20px 25px -5px rgba(226, 232, 240, 0.5), 0 8px 10px -6px rgba(226, 232, 240, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
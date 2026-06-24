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
        // Đồng bộ tông màu xanh tình nguyện QNU chủ đạo của hệ thống
        qnu: {
          blue: "#0055A5",
          dark: "#0b2046",
          light: "#F9FBFF",
        },
      },
      borderRadius: {
        // Giữ các cấu hình bo tròn góc cực mạnh theo thiết kế gốc
        'soft': '2rem',
        'super': '3rem',
      },
      boxShadow: {
        // Đồng bộ các hiệu ứng đổ bóng màu xanh dương nhẹ bao quanh card
        'soft-xl': '0 20px 25px -5px rgba(226, 232, 240, 0.5), 0 8px 10px -6px rgba(226, 232, 240, 0.5)',
        'blue-glow': '0 10px 25px -5px rgba(0, 85, 165, 0.08), 0 8px 10px -6px rgba(0, 85, 165, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
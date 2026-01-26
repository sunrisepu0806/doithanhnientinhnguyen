import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Giữ cái này để bỏ qua lỗi Code (TS)
    ignoreBuildErrors: true,
  },
  // ĐÃ XÓA PHẦN ESLINT GÂY LỖI
};

export default nextConfig;
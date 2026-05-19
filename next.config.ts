import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Xóa sạch phần eslint cũ đi, không để gì ở đây cả
};

export default nextConfig;
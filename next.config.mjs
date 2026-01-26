/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Thêm dòng này để bỏ qua các lỗi nhỏ về thư viện cũ
  swcMinify: true,
};

export default nextConfig;
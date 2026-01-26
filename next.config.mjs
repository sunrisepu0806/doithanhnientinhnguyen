/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Bỏ qua lỗi TypeScript
  },
  eslint: {
    ignoreDuringBuilds: true, // Bỏ qua lỗi ESLint (thay cho --no-lint)
  },
  swcMinify: true,
  reactStrictMode: false,
};

export default nextConfig;
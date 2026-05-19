/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Tắt kiểm tra lỗi TypeScript khi build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Tắt kiểm tra lỗi ESLint khi build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
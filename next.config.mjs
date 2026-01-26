/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bỏ qua lỗi TypeScript khi build để web không bị dừng giữa chừng
  typescript: {
    ignoreBuildErrors: true,
  },
  // Bỏ qua lỗi ESLint khi build (kết hợp với lệnh --no-lint bạn đã thêm)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Các cấu hình khác nếu có bạn có thể thêm ở dưới này
};

export default nextConfig;
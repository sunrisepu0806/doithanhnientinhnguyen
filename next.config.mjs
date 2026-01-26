/** @type {import('next').NextConfig} */
const nextConfig = {
  // Chỉ giữ lại cái này để tắt kiểm tra TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  // KHÔNG cần dòng eslint nữa vì mình đã dùng --no-lint trong package.json rồi
};

export default nextConfig;

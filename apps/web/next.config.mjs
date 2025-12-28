/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // 🔥 关键: 静态导出
  basePath: '',  // Web 在根路径
  trailingSlash: true,  // 生成 /about/index.html
  typescript: {
    ignoreBuildErrors: false,  // 生产构建严格模式
  },
  images: {
    unoptimized: true,  // 静态托管必需
  },
}

export default nextConfig

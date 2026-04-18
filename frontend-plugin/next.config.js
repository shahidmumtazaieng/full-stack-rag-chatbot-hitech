/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Transpile lucide-react
  transpilePackages: ['lucide-react'],
  // Turbopack configuration
  turbopack: {},
}

module.exports = nextConfig
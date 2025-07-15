/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ★ このimagesブロックを追加します
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3-ap-northeast-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

export default nextConfig;
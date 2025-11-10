/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nexiums/shared'],
  webpack: (config) => {
    // Fix for Monaco Editor
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource'
    });
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/api/:path*'
      }
    ];
  }
};

module.exports = nextConfig;

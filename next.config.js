/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  env: {
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },
}

module.exports = nextConfig

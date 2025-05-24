/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: 'loose', // Required for emoji-mart
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }];  // Required for emoji-mart
    return config;
  },
}

module.exports = nextConfig

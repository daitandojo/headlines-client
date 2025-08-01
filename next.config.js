/** @type {import('next').NextConfig} */
const nextConfig = {
  // This block is what you need to add.
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
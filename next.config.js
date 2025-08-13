// next.config.js (version 1.7)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // The 'disable' flag is removed to enable PWA features in development.
  // We revert to `customWorkerDir`, which is the correct property for next-pwa@5.6.0.
  customWorkerDir: 'worker', 
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'onnxruntime-node'];
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
// next.config.js (version 1.5)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // The `disable` flag has been removed to enable PWA features in development.
  // The `customWorkerDir` is replaced by the more modern `extend` option below.
  extend: {
    // This injects our custom service worker logic into the generated file.
    importScripts: ['sw-custom.js'],
  },
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
// next.config.js (version 1.4)
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // The PWA plugin can be unreliable in dev mode with HMR.
  // It's best to disable it for development and test PWA features in a production build.
  // To test PWA: `npm run build && npm run start`
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker', // Instructs next-pwa to merge our custom logic
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
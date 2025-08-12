/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  
  // --- START: PROFESSIONAL FIX FOR NATIVE MODULES ---
  // This configuration tells Next.js's bundler (Webpack) to treat
  // 'onnxruntime-node' as an external module. This prevents Webpack
  // from trying to bundle the native .node file for the client,
  // which is the cause of the compilation error.
  webpack: (config, { isServer }) => {
    // Only apply this rule on the server-side build
    if (isServer) {
      config.externals = [...config.externals, 'onnxruntime-node'];
    }
    return config;
  },
  // --- END: PROFESSIONAL FIX ---
};

module.exports = nextConfig;
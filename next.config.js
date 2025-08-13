// next.config.js (version 4.0)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is a clean, standard Next.js config with NO PWA wrappers.
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

module.exports = nextConfig;
// next.config.js (version 5.0)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are now enabled by default in Next.js 14+.
  // The 'experimental' flag has been removed.

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'onnxruntime-node']
    }
    return config
  },
}

module.exports = nextConfig

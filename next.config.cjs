// next.config.js (version 2.9)
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // All Webpack configurations are removed as they are unnecessary.
  // The problem is solved at the file system level by patching the dependency.
};

module.exports = withPWA(nextConfig);
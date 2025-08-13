// scripts/patch-transformers.js (version 2.0)
const fs = require('fs');
const path = require('path');

// The known-good, browser-only content for the env.js file.
const overrideContent = `
// This file is a build-time override for the environment detection in @xenova/transformers.
// It forces the library to believe it is running in a browser environment,
// which prevents Webpack from attempting to bundle the native \`onnxruntime-node\` module.
export const env = {
    isBrowser: true,
    isNode: false,
    isWebWorker: false,
    remoteModels: true,
    remoteHost: 'https://huggingface.co/',
    remotePathTemplate: '{model}/resolve/{revision}/',
    localModels: false,
    localModelPath: '/models/',
    useCache: true,
    useWebGPU: false,
    useSimd: false,
};
`;

const envPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@xenova',
  'transformers',
  'src',
  'env.js'
);

try {
  if (fs.existsSync(envPath)) {
    console.log('[Patch] Found @xenova/transformers/src/env.js. Overwriting...');
    // Physically overwrite the entire file with our safe, browser-only version.
    fs.writeFileSync(envPath, overrideContent.trim(), 'utf8');
    console.log('[Patch] Successfully overwrote env.js to prevent onnxruntime-node import.');
  } else {
    console.warn('[Patch] Could not find @xenova/transformers/src/env.js to patch. The build may fail.');
  }
} catch (error) {
  console.error('[Patch] An error occurred during the patching process:', error);
  process.exit(1);
}
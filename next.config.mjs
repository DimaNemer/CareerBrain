/**
 * Routes that load the local embedding model, either directly or through
 * lib/ai-skills.js and lib/embed-skills.js.
 */
const embedRoutes = [
  '/api/opportunities/sync',
  '/api/opportunities/sync/remotive',
  '/api/opportunities/sync/embed',
  '/api/cron/sync',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.1.1.*'],
  serverExternalPackages: [
    '@xenova/transformers',
    '@napi-rs/canvas',
    'pdf-parse',
    'pdfjs-dist',
    'sharp',
  ],
  outputFileTracingIncludes: {
    ...Object.fromEntries(
      embedRoutes.map((route) => [
        route,
        [
          // Model files fetched by scripts/download-embed-model.mjs at build time.
          './models/**/*',
          // onnxruntime-node resolves this library path at runtime, so the
          // tracer cannot discover it and the native load fails without it.
          './node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*',
        ],
      ])
    ),
  },
};

export default nextConfig;

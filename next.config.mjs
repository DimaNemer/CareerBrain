/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@xenova/transformers',
    '@napi-rs/canvas',
    'pdf-parse',
    'pdfjs-dist',
    'sharp',
  ],
};

export default nextConfig;

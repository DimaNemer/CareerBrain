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
};

export default nextConfig;

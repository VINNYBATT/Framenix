/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', '@google/genai'],
  async rewrites() {
    return [
      // The cinematic landing page (section 13 of the master prompt) is a
      // standalone, no-build-step file at public/index.html. The product
      // itself lives under /studio; "/" is purely the marketing surface.
      { source: '/', destination: '/index.html' },
    ];
  },
};

module.exports = nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Tell Next.js to treat mongoose as a server-only external package
  // This prevents bundling issues and DNS resolution problems on local dev
  serverExternalPackages: ['mongoose'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '52mb',
    },
  },
};

export default nextConfig;

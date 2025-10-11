import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.mezon.ai',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.mezon.vn',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;

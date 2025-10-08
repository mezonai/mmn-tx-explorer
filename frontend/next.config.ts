import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*', // gọi /api/... trong code frontend
        destination: 'https://oauth2.mezon.ai/:path*', // Next.js proxy tới API thật
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    // Bank logos for VietQR payment cards. Proxying them through next/image also makes them same-origin,
    // which lets the QR card be drawn onto a canvas for PNG export.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.vietqr.io', pathname: '/img/**' }],
  },
};

export default nextConfig;

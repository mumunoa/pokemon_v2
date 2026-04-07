import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.mumunoa.com' }],
        destination: 'https://mumunoa.com/:path*',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/image-proxy/:path*',
        destination: 'https://www.pokemon-card.com/:path*',
      },
    ]
  }
};

export default nextConfig;

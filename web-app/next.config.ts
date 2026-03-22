import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

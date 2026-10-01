import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/api/metrology/:path*',
        destination: `${backendUrl}/api/metrology/:path*`,
      },
      {
        source: '/api/standards/:path*',
        destination: `${backendUrl}/api/standards/:path*`,
      },
    ];
  },
};

export default nextConfig;

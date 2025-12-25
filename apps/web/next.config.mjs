/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/tracker/:path*',
        destination: (process.env.TRACKER_API_URL || process.env.NEXT_PUBLIC_TRACKER_API_URL || 'http://tracker-api:3100').replace(/\/$/, '') + '/v1/:path*',
      },
      {
        source: '/api/docgen/:path*',
        destination: (process.env.DOCGEN_API_URL || 'http://docgen:8000').replace(/\/$/, '') + '/:path*',
      },
      {
        source: '/api/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://api:8000').replace(/\/$/, '') + '/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/tracker/history',
        destination: '/tracker/history/travel',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

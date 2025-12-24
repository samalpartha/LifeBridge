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
        destination: 'http://tracker-api:3100/v1/:path*', // Proxy to Tracker API service name
      },
      {
        source: '/api/:path*',
        destination: 'http://api:8000/:path*', // Proxy to Python API service name
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

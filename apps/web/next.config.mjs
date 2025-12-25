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
        destination: (() => {
          let url = process.env.TRACKER_API_URL || process.env.NEXT_PUBLIC_TRACKER_API_URL || 'http://tracker-api:3100';
          url = url.replace(/\/$/, '');
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          return url + '/v1/:path*';
        })(),
      },
      {
        source: '/api/docgen/:path*',
        destination: (() => {
          let url = process.env.DOCGEN_API_URL || 'http://docgen:8000';
          url = url.replace(/\/$/, '');
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          return url + '/:path*';
        })(),
      },
      {
        source: '/api/:path*',
        destination: (() => {
          let url = process.env.NEXT_PUBLIC_API_URL || 'http://api:8000';
          url = url.replace(/\/$/, '');
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          return url + '/:path*';
        })(),
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

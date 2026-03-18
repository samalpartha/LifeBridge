/** @type {import('next').NextConfig} */
const distDir = process.env.NEXT_DIST_DIR || ".next";

function normalizeProxyDestination(rawUrl, fallback, suffix) {
  let url = (rawUrl || fallback || "").trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  // Avoid localhost IPv6 resolution issues in local dev.
  url = url
    .replace(/^http:\/\/localhost(?=[:/]|$)/i, "http://127.0.0.1")
    .replace(/^https:\/\/localhost(?=[:/]|$)/i, "https://127.0.0.1");
  return `${url}${suffix}`;
}

const nextConfig = {
  distDir,
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
        destination: normalizeProxyDestination(
          process.env.TRACKER_API_URL || process.env.NEXT_PUBLIC_TRACKER_API_URL,
          'http://tracker-api:3100',
          '/v1/:path*'
        ),
      },
      {
        source: '/api/docgen/:path*',
        destination: normalizeProxyDestination(
          process.env.DOCGEN_API_URL,
          'http://docgen:8000',
          '/:path*'
        ),
      },
      {
        source: '/api/:path*',
        destination: normalizeProxyDestination(
          process.env.NEXT_PUBLIC_API_URL,
          'http://api:8000',
          '/:path*'
        ),
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

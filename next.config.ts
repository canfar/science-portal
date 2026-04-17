import type { NextConfig } from 'next';

// External API URLs are resolved at runtime on the server (see server-config).
// NEXT_PUBLIC_* values here are optional at build; set them in the container if needed.

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
  },
  // Client-exposed keys only. Do not set LOGIN_API/SKAHA_API here — that would
  // bake empty build-time values and override runtime env in standalone/server.
  env: {
    API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || '30000',
    ENABLE_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS || 'false',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;

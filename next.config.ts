import type { NextConfig } from 'next';

// Validate required environment variables at build time
const requiredEnvVars = [
  'NEXT_PUBLIC_LOGIN_API',
  'NEXT_PUBLIC_SKAHA_API',
] as const;

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true,
  },
  // Expose environment variables to the client
  env: {
    LOGIN_API: process.env.NEXT_PUBLIC_LOGIN_API,
    SKAHA_API: process.env.NEXT_PUBLIC_SKAHA_API,
    API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || '30000',
    ENABLE_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS || 'false',
  },
};

export default nextConfig;

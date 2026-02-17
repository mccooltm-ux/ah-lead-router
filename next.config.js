/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Skip type checking during build - types are checked in dev/CI
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
  experimental: {},
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // FIX: TypeScript and ESLint errors are now checked during build.
  // Previously both were set to `true` which silently hid bugs.
  //
  // If you have TS errors that need fixing first, address them —
  // don't hide them. Each suppressed error is a potential runtime crash.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {},
};

module.exports = nextConfig;

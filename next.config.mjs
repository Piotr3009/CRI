/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // MVP note: ESLint is still available via `npm run lint`, but we don't block
  // production builds on lint so that long-form marketing copy (apostrophes,
  // quotes) doesn't fail the build. TypeScript type-checking stays enabled.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

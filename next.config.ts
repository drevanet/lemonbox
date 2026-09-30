/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore lint errors during production builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

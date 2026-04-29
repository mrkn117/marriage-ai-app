/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'storage.googleapis.com',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  // Suppress dynamic server usage warnings during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

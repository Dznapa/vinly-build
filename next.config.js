/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Real bottle images per /spec/ASSETS.md — public Commerce7 sandbox CDN.
      { protocol: 'https', hostname: 'images.commerce7.com', pathname: '/**' },
      // Fallback for Vinly-served marketing imagery.
      { protocol: 'https', hostname: 'vinly.wine', pathname: '/**' },
      { protocol: 'https', hostname: 'vinlywine.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;

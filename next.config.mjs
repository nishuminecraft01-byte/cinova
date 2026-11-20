/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  webpack: (config) => {
    // Completely disable persistent disk pack cache in OneDrive environment
    // to prevent .pack file locking and manifest hash mismatches
    config.cache = false;
    return config;
  },
};

export default nextConfig;

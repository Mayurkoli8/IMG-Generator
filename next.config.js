/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Tell Next.js NOT to bundle these — load them natively at runtime
    serverComponentsExternalPackages: [
      "sharp",
      "@prisma/client",
      "prisma",
      "cloudinary",
      "@aws-sdk/client-s3",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from trying to bundle optional native modules
      config.externals.push(
        "sharp",
        "cloudinary",
        "@aws-sdk/client-s3"
      );
    }
    return config;
  },
};

module.exports = nextConfig;

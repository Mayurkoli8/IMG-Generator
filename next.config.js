/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["sharp", "@prisma/client", "prisma"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },
  // Increase body parser limit for uploads
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
    responseLimit: "20mb",
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("sharp");
    }
    return config;
  },
};

module.exports = nextConfig;

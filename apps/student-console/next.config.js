/** @type { import('next').NextConfig } */

const NODE_ENV = process.env.NODE_ENV;

const baseConfig =
  !NODE_ENV || NODE_ENV === "development"
    ? {}
    : {
        basePath: "/student-console",
        assetPrefix: "/student-console",
        async rewrites() {
          return [
            {
              source: "/student-console/:path*",
              destination: "/:path*",
            },
          ];
        },
      };

const nextConfig = {
  ...baseConfig,

  transpilePackages: ["@repo/db", "@repo/utils", "@repo/ui"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "74.207.233.48",
        port: "8443",
        pathname: "/hrclIRP/studentimages/**",
      },
      {
        protocol: "https",
        hostname: "i.gr-assets.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t3.ftcdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "t4.ftcdn.net",
        port: "",
        pathname: "/**",
      },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3008", "czz2p47w-3008.inc1.devtunnels.ms", "*.inc1.devtunnels.ms"],
      bodySizeLimit: "2mb",
    },
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
    };
    return config;
  },
};

module.exports = nextConfig;

/** @type { import('next').NextConfig } */

const NODE_ENV = process.env.NEXT_PUBLIC_APP_ENV;

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
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3000",
        pathname: "/**",
      },
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
      {
        protocol: "https",
        hostname: "besc.academic360.app",
        port: "",
        pathname: "/student-console/**",
      },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3008", "czz2p47w-3008.inc1.devtunnels.ms", "*.inc1.devtunnels.ms"],
      bodySizeLimit: "50mb",
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

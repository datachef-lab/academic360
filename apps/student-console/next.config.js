/** @type {import('next').NextConfig} */
const nextConfig = {
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
            allowedOrigins: [
                "localhost:3008",
                "czz2p47w-3008.inc1.devtunnels.ms",
                "*.inc1.devtunnels.ms"
            ],
            bodySizeLimit: "2mb",
        },
    },
};

module.exports = nextConfig; 
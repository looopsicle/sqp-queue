import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.8",
    "192.168.1.*",
    "10.100.1.84",
    "10.100.1.*",
    "10.*.*.*",
    "192.168.*.*",
    "172.*.*.*",
    "localhost",
    "127.0.0.1",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

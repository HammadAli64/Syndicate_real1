import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack: (config, { dev }) => {
    // Avoid intermittent webpack pack cache corruption on some Windows setups.
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;

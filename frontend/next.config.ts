import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cinecouch/shared"],
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;

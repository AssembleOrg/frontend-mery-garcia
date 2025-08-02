import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.plugins = config.plugins || [];
    config.plugins.push(new CaseSensitivePathsPlugin());

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

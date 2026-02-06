import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Webpack configuration - only used when --webpack flag is passed
  webpack: (config, { isServer }) => {
    config.plugins = config.plugins || [];
    config.plugins.push(new CaseSensitivePathsPlugin());

    return config;
  },
  // Turbopack configuration - empty to allow webpack config to work
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint config removed - use 'next lint' command instead
};

export default nextConfig;

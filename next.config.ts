import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis'],
  experimental: {
    serverActions: { bodySizeLimit: '25mb' },
  },
  // Disable webpack persistent cache to avoid filling disk
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default nextConfig

import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbo: {
    rules: {
      '**/.genkit-state.json': {
        loaders: ['empty-loader'],
      },
    },
  },
  webpack: (config, { isServer }) => {
    const ignored = Array.isArray(config.watchOptions.ignored)
      ? config.watchOptions.ignored
      : [];
    config.watchOptions = {
        ...config.watchOptions,
        ignored: [
            ...ignored,
            '**/.genkit-state.json'
        ]
    }
    return config
  }
};

export default nextConfig;

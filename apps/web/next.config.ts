import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Docker standalone 빌드를 위한 설정
  output: 'standalone',

  // Turbopack 모노레포 루트 설정
  turbopack: {
    root: process.env.DOCKER_BUILD === '1' ? '/app' : path.resolve(process.cwd(), '../..'),
  },

  // 실험적 기능
  experimental: {
    // 서버 액션 설정
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'api',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
  },

  // 환경 변수 설정
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },

  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // Webpack 설정
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@icons/shared': path.resolve(__dirname, '../../packages/shared/src'),
    };
    return config;
  },
};

export default nextConfig;

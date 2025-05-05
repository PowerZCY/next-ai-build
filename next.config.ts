import createNextIntlPlugin from 'next-intl/plugin';
import { createMDX } from 'fumadocs-mdx/next';
import { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  
  // mdx需要的配置
  reactStrictMode: true,

  images: {
    unoptimized: true,
    // 允许加载图片的host
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'favicon.im',
      },
      {
        protocol: 'https',
        hostname: 'preview.reve.art',
      }
    ],
    // 允许加载svg图片
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true
  },
};

export default withNextIntl(withMDX(nextConfig));
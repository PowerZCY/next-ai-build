import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Generate robots.txt content
 * @param baseUrl - The base URL of the website
 * @returns Robots configuration
 */
export function generateRobots(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

/**
 * Generate sitemap.xml content
 * @param baseUrl - The base URL of the website
 * @param locales - Supported locales array
 * @param mdxSourceDir - MDX source directory path
 * @param openMdxSEOSiteMap - Whether to include MDX content in sitemap, default is true
 * @returns Sitemap entries
 */
export function generateSitemap(
  baseUrl: string,
  locales: string[],
  mdxSourceDir: string,
  openMdxSEOSiteMap: boolean = true
): MetadataRoute.Sitemap {
  // 1. read all blog mdx file names
  const blogDir = path.join(process.cwd(), mdxSourceDir);
  const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

  // 2. handle index.mdx (blog start page) and other slugs
  const blogRoutes: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const f of blogFiles) {
      if (f === 'index.mdx') {
        blogRoutes.push({
          url: `${baseUrl}/${locale}/blog`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 1.0
        });
      } else {
        const slug = f.replace(/\.mdx$/, '');
        blogRoutes.push({
          url: `${baseUrl}/${locale}/blog/${slug}`,
          lastModified: new Date(),
          changeFrequency: f === 'ioc.mdx' ? 'daily' : 'monthly',
          priority: 0.8
        });
      }
    }
  }

  // 3. main page (all language versions)
  const mainRoutes = locales.map(locale => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 1.0
  }));

  return openMdxSEOSiteMap ? [...mainRoutes, ...blogRoutes] : [...mainRoutes];
}

/**
 * Create robots.txt handler function
 * @param baseUrl - The base URL of the website
 * @returns Robots handler function
 */
export function createRobotsHandler(baseUrl: string) {
  return function robots(): MetadataRoute.Robots {
    return generateRobots(baseUrl);
  };
}

/**
 * Create sitemap.xml handler function
 * @param baseUrl - The base URL of the website
 * @param locales - Supported locales array
 * @param mdxSourceDir - MDX source directory path
 * @param openMdxSEOSiteMap - Whether to include MDX content in sitemap, default is true
 * @returns Sitemap handler function
 */
export function createSitemapHandler(
  baseUrl: string,
  locales: string[],
  mdxSourceDir: string,
  openMdxSEOSiteMap: boolean = true
) {
  // force static generation
  const sitemapHandler = function sitemap(): MetadataRoute.Sitemap {
    return generateSitemap(baseUrl, locales, mdxSourceDir, openMdxSEOSiteMap);
  };
  
  // Add static generation directive
  (sitemapHandler as any).dynamic = 'force-static';
  
  return sitemapHandler;
}
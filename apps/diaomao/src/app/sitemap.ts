import { MetadataRoute } from 'next'
import { appConfig } from "@/lib/appConfig";

// force static generation
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appConfig.baseUrl
  const locales = appConfig.i18n.locales

  const routes = [
    // main page (all locales)
    ...locales.map(locale => ({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0
    }))
  ]

  return routes
}

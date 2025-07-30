import { appConfig } from "@/lib/appConfig";
import { createSitemapHandler } from "@third-ui/lib/server";

export default createSitemapHandler(
  appConfig.baseUrl,
  appConfig.i18n.locales as string[],
  appConfig.mdxSourceDir.blog,
);

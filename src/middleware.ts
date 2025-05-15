import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { appConfig } from "@/lib/appConfig";

const intlMiddleware = createMiddleware({
  // 多语言配置
  locales: appConfig.i18n.locales,

  // 默认语言配置
  defaultLocale: appConfig.i18n.defaultLocale,
  localePrefix: "always", // 改为 always，确保始终使用语言前缀
  localeDetection: false  // 添加此配置以禁用自动语言检测
});

export function middleware(request: NextRequest) {
  // 处理根路径到默认语言的永久重定向
  if (request.nextUrl.pathname === '/') {
    const defaultLocale = appConfig.i18n.defaultLocale;
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url), 301);
  }

  // 处理尾部斜杠的重定向
  if (request.nextUrl.pathname.length > 1 && request.nextUrl.pathname.endsWith('/')) {
    const newUrl = new URL(request.nextUrl.pathname.slice(0, -1), request.url);
    return NextResponse.redirect(newUrl, 301);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // 修改 matcher 配置以确保正确匹配所有路由
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type NextRequest, NextResponse } from 'next/server';

import { mdxSourceMap } from '@/lib/source';
import { appConfig } from '@/lib/appConfig';
import { LLMCopyHandler } from '@lib/llm-copy-handler';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') ?? appConfig.i18n.defaultLocale;
  const requestedPath = searchParams.get('path');
  const sourceKey = searchParams.get('sourceKey');
  const validSourceKeys = Object.keys(mdxSourceMap) as Array<keyof typeof mdxSourceMap>;
  type sourceKeyType= keyof typeof mdxSourceMap;

if (!sourceKey || !validSourceKeys.includes(sourceKey as sourceKeyType)) {
  return new Response(`Invalid sourceKey: ${sourceKey}`, { status: 400 });
}

  if (!requestedPath) {
    console.error('API llm-content: Missing path query parameter');
    return new NextResponse('Missing path query parameter', { status: 400 });
  }

  const result = await LLMCopyHandler({
    sourceDir: appConfig.mdxSourceDir[sourceKey as sourceKeyType],
    dataSource: mdxSourceMap[sourceKey as sourceKeyType],
    requestedPath,
    locale,
  });

  if (result.error) {
    console.error(`API llm-content: ${result.error}`);
    return new NextResponse(result.error, { status: result.status });
  }
  return new NextResponse(result.text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
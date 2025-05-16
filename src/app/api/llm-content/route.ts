import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/lib/get-llm-text';
import { docsSource } from '@/lib/source';
import { appConfig } from '@/lib/appConfig';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') ?? appConfig.i18n.defaultLocale;
  const path = searchParams.get('path');

  console.log(`API Route llm-content: Received locale=${locale}, path=${path}`);

  if (!path) {
    return new NextResponse('Missing path query parameter', { status: 400 });
  }

  // Split the path back into an array of slugs
  const slug = path.split('/');

  const page = docsSource.getPage(slug, locale);

  if (!page) {
    console.error(`API Route llm-content: Page not found for locale=${locale}, path=${path}`);
    // Return a 404 response from the API route
    return new NextResponse('Page not found', { status: 404 }); 
  }

  try {
    const text = await getLLMText(page);
    // Set content type to plain text for Markdown
    return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error(`API Route llm-content: Error generating text for locale=${locale}, path=${path}:`, error);
    return new NextResponse('Internal Server Error generating MDX content', { status: 500 });
  }
}

// No revalidate or generateStaticParams needed for API routes usually 
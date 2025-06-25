/* eslint-disable @typescript-eslint/no-explicit-any */

import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@windrun-huaiin/lib/llm-utils';
import { docsSource } from '@/lib/source';
import { appConfig } from '@/lib/appConfig';
import fs from 'node:fs'; // For reading file content
import nodePath from 'node:path'; // Renamed to avoid conflict with 'path' searchParam

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get('locale') ?? appConfig.i18n.defaultLocale;
  const requestedPath = searchParams.get('path'); // Use 'requestedPath' to avoid conflict with 'nodePath' module

  console.log(`API Route llm-content: Received locale=${locale}, path=${requestedPath}`);

  if (!requestedPath) {
    return new NextResponse('Missing path query parameter', { status: 400 });
  }
  const slug = requestedPath.split('/');

  try {
    console.log('Attempting to call docsSource.getPage()');
    const page = docsSource.getPage(slug, locale);
    console.log('Call to docsSource.getPage() completed.');

    if (!page || !page.data) {
      console.error(`Page or page.data not found for locale=${locale}, path=${requestedPath}`);
      return new NextResponse('Page data not found', { status: 404 });
    }
    if (!page.data._file || !page.data._file.path) {
      console.error(`_file path information missing in page.data for locale=${locale}, path=${requestedPath}`);
      return new NextResponse('Page file path information missing', { status: 500 });
    }

    const title = page.data.title;
    const description = page.data.description;
    const relativeMdxFilePath = page.data._file.path; // e.g., "introduction/(mdx)/test.mdx"

    // Construct absolute path for runtime file reading in Vercel (/var/task is process.cwd())
    // Assumes that the 'src/mdx/docs' structure is preserved relative to process.cwd()
    const absoluteFilePath = nodePath.join(process.cwd(), 'src', 'mdx', 'docs', relativeMdxFilePath);
    console.log(`Attempting to read MDX content from: ${absoluteFilePath}`);

    let mdxContent: string;
    try {
      mdxContent = fs.readFileSync(absoluteFilePath, 'utf-8');
      console.log(`Successfully read MDX content from: ${absoluteFilePath}`);
    } catch (readError: any) {
      console.error(`Failed to read file at: ${absoluteFilePath}. Error: ${readError.message}`);
      console.error("Read Error object details:", JSON.stringify(readError, Object.getOwnPropertyNames(readError), 2));
      // For debugging, list directories if file read fails
      try {
        console.log(`Current CWD: ${process.cwd()}`);
        console.log(`CWD contents: ${fs.readdirSync(process.cwd()).join(', ')}`);
        const srcPath = nodePath.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
          console.log(`src dir contents: ${fs.readdirSync(srcPath).join(', ')}`);
          const srcMdxPath = nodePath.join(process.cwd(), 'src', 'mdx');
          if (fs.existsSync(srcMdxPath)) {
            console.log(`src/mdx dir contents: ${fs.readdirSync(srcMdxPath).join(', ')}`);
            const srcMdxDocsPath = nodePath.join(process.cwd(), 'src', 'mdx', 'docs');
            if (fs.existsSync(srcMdxDocsPath)) {
                console.log(`src/mdx/docs dir contents: ${fs.readdirSync(srcMdxDocsPath).join(', ')}`);
            }
          }
        }
      } catch (listDirError: any) {
        console.warn(`Could not list directory contents for debugging: ${listDirError.message}`);
      }
      return new NextResponse(`Error reading MDX file: ${readError.message}`, { status: 500 });
    }

    const text = await getLLMText(mdxContent, title, description);
    return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (error: any) {
    console.error(`API Route llm-content: General error for locale=${locale}, path=${requestedPath}:`, error);
    console.error("General Error object details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// No revalidate or generateStaticParams needed for API routes usually 
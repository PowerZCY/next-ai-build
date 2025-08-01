/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'node:fs';
import nodePath from 'node:path';
import { getLLMText } from '@lib/llm-utils';

export type LLMCopyHandlerOptions = {
  // for example: "src/mdx/blog"
  sourceDir: string;
  // data source object, like blogSource, legalSource
  dataSource: {
    getPage: (slug: string[], locale: string) => any | undefined;
  };
  // for example: "blog/2025/07/07/test"
  requestedPath?: string;
  locale: string;
};

/**
 * General MDX content reading and processing tool function, logs are consistent with router.
 */
export async function LLMCopyHandler(options: LLMCopyHandlerOptions): Promise<{ text?: string; error?: string; status: number }> {
  const { sourceDir, dataSource, requestedPath, locale } = options;

  // log received parameters
  console.log(`[LLMCopy] Received, locale=${locale}, path=${requestedPath}`);

  const slug = requestedPath?.split('/') || [];

  try {
    console.log('[LLMCopy] Attempting to call getPage()');
    const page = dataSource.getPage(slug, locale);
    console.log('[LLMCopy] Call to getPage() completed.');

    if (!page || !page.data) {
      console.error(`[LLMCopy] Page or page.data not found for locale=${locale}, path=${requestedPath}`);
      return { error: 'Page data not found', status: 404 };
    }
    if (!page.data._file || !page.data._file.path) {
      console.error(`[LLMCopy] _file path information missing in page.data for locale=${locale}, path=${requestedPath}`);
      return { error: 'Page file path information missing', status: 500 };
    }

    const title = page.data.title;
    const description = page.data.description;
    const relativeMdxFilePath = page.data._file.path;
    const absoluteFilePath = nodePath.join(process.cwd(), sourceDir, relativeMdxFilePath);
    console.log(`[LLMCopy] Attempting to read MDX content from: ${absoluteFilePath}`);

    let mdxContent: string;
    try {
      mdxContent = fs.readFileSync(absoluteFilePath, 'utf-8');
      console.log(`[LLMCopy] Successfully read MDX content from: ${absoluteFilePath}`);
    } catch (readError: any) {
      console.error(`[LLMCopy] Failed to read file at: ${absoluteFilePath}. Error: ${readError.message}`);
      console.error('[LLMCopy] Read Error object details:', JSON.stringify(readError, Object.getOwnPropertyNames(readError), 2));
      // directory traversal debug logs
      try {
        console.log(`[LLMCopy] Current CWD: ${process.cwd()}`);
        console.log(`[LLMCopy] CWD contents: ${fs.readdirSync(process.cwd()).join(', ')}`);
        const srcPath = nodePath.join(process.cwd(), 'src');
        if (fs.existsSync(srcPath)) {
          console.log(`[LLMCopy] src dir contents: ${fs.readdirSync(srcPath).join(', ')}`);
          const srcMdxPath = nodePath.join(process.cwd(), 'src', 'mdx');
          if (fs.existsSync(srcMdxPath)) {
            console.log(`[LLMCopy] src/mdx dir contents: ${fs.readdirSync(srcMdxPath).join(', ')}`);
            const srcMdxDocsPath = nodePath.join(process.cwd(), sourceDir);
            if (fs.existsSync(srcMdxDocsPath)) {
                console.log(`[LLMCopy] ${sourceDir} dir contents: ${fs.readdirSync(srcMdxDocsPath).join(', ')}`);
            }
          }
        }
      } catch (listDirError: any) {
        console.warn(`[LLMCopy] Could not list directory contents for debugging: ${listDirError.message}`);
      }
      return { error: `Error reading MDX file: ${readError.message}`, status: 500 };
    }

    try {
      const text = await getLLMText(mdxContent, title, description);
      return { text, status: 200 };
    } catch (error: any) {
      console.error(`[LLMCopy] Error processing MDX content for locale=${locale}, path=${requestedPath}:`, error);
      console.error('[LLMCopy] General Error object details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      return { error: 'Error processing MDX content', status: 500 };
    }
  } catch (error: any) {
    console.error(`[LLMCopy] General error for locale=${locale}, path=${requestedPath}:`, error);
    console.error('[LLMCopy] General Error object details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return { error: 'Internal Server Error', status: 500 };
  }
} 
import fs from 'fs/promises';
import path from 'path';

interface Frontmatter {
  title?: string;
  description?: string;
  icon?: string;
  date?: string;
}

interface ProcessedArticle {
  slug: string;
  title: string;
  description?: string;
  frontmatterIcon?: string;
  href: string;
  date?: string;
}

interface MetaJson {
  pages: string[];
}

const BLOG_MDX_PATH = path.join(process.cwd(), 'src/mdx/blog');
const INDEX_MDX_FILE = path.join(BLOG_MDX_PATH, 'index.mdx');
const META_JSON_FILE = path.join(BLOG_MDX_PATH, 'meta.json');
const IOC_MDX_FILE = path.join(BLOG_MDX_PATH, 'ioc.mdx');
const BLOG_PREFIX = 'blog'; // 文章路径前缀，便于不同工程复用，如无前缀可设为 ''
const IOC_SLUG = 'ioc'; // ioc 索引页 slug，便于统一维护

function parseFrontmatter(fileContent: string): Frontmatter {
  const frontmatter: Frontmatter = {};
  const match = fileContent.match(/^---([\s\S]*?)---/);
  if (match && match[1]) {
    const lines = match[1].trim().split('\n');
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        if (key.trim() === 'title') frontmatter.title = value;
        if (key.trim() === 'description') frontmatter.description = value;
        if (key.trim() === 'icon') frontmatter.icon = value;
        if (key.trim() === 'date') frontmatter.date = value;
      }
    }
  }
  return frontmatter;
}

function getIconComponentString(iconName?: string): string | undefined {
  if (!iconName) return undefined;
  // Assuming iconName is a valid React component name
  return `<${iconName} />`;
}

function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function updateFrontmatterDate(frontmatter: string): string {
  const currentDate = getCurrentDateString();
  
  // Check if date field exists
  if (frontmatter.includes('date:')) {
    // Replace existing date
    return frontmatter.replace(/date:\s*[^\n]*/, `date: ${currentDate}`);
  } else {
    // Add date field before the closing ---
    return frontmatter.replace(/---$/, `date: ${currentDate}\n---`);
  }
}

async function getAllBlogArticles(): Promise<ProcessedArticle[]> {
  const articles: ProcessedArticle[] = [];
  try {
    const files = await fs.readdir(BLOG_MDX_PATH);
    for (const file of files) {
      if (file.endsWith('.mdx') && file !== 'index.mdx') {
        const slug = file.replace(/\.mdx$/, '');
        const filePath = path.join(BLOG_MDX_PATH, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const fm = parseFrontmatter(content);

          if (!fm.title) {
            console.warn(`WARN: Article "${file}" is missing a title in its frontmatter. Skipping.`);
            continue;
          }

          articles.push({
            slug,
            title: fm.title,
            description: fm.description,
            frontmatterIcon: fm.icon,
            href: `./blog/${slug}`, // Reverted to ./blog/slug format as per original requirement
            date: fm.date,
          });
        } catch (readError) {
          console.warn(`WARN: Could not read or parse frontmatter for "${file}":`, readError);
        }
      }
    }
  } catch (dirError) {
    console.error('ERROR: Could not read blog directory:', dirError);
    // Return empty or throw, depending on desired error handling
    return [];
  }
  return articles;
}

async function generateBlogIndex() {
  try {
    console.log('Starting to generate blog index (standalone script)...');

    let meta: MetaJson = { pages: [] };
    try {
      const metaContent = await fs.readFile(META_JSON_FILE, 'utf-8');
      meta = JSON.parse(metaContent);
    } catch (metaError) {
      console.warn(`WARN: Could not read or parse ${META_JSON_FILE}. No articles will be marked as featured.`);
    }
    
    // ioc 相关处理
    const iocSlug = IOC_SLUG;
    const featuredSlugs = meta.pages
      .map(p => p.endsWith('.mdx') ? p.slice(0, -4) : p)
      .filter(slug => slug !== 'index' && slug !== '...' && slug !== iocSlug && slug !== `!${iocSlug}`);
    console.log('Featured slugs (meta-config):', featuredSlugs);

    const allArticles = await getAllBlogArticles();
    console.log(`Found ${allArticles.length} all articles.`);

    // ioc 文章单独处理
    const iocArticle = allArticles.find(a => a.slug === IOC_SLUG);

    const filteredArticles = allArticles.filter(a => a.slug !== IOC_SLUG);

    if (filteredArticles.length === 0 && featuredSlugs.length === 0) {
      console.warn("No articles found or featured. The generated index might be empty or minimal.");
    }

    const featuredArticles: ProcessedArticle[] = [];
    const pastArticles: ProcessedArticle[] = [];

    filteredArticles.forEach(article => {
      if (featuredSlugs.includes(article.slug)) {
        featuredArticles.push(article);
      } else {
        pastArticles.push(article);
      }
    });

    // Sort articles by date in descending order (newest first)
    const sortByDateDesc = (a: ProcessedArticle, b: ProcessedArticle) => {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date); // Newest first
      }
      if (a.date) return -1; // Articles with date come before those without
      if (b.date) return 1;  // Articles with date come before those without
      return 0; // Keep original order if both lack dates
    };

    featuredArticles.sort(sortByDateDesc);
    pastArticles.sort(sortByDateDesc);

    console.log(`Found ${featuredArticles.length} featured articles (sorted by date).`);
    console.log(`Found ${pastArticles.length} past articles (sorted by date).`);

    // Preserve existing frontmatter or use a default
    let currentFileFrontmatter = '---\ntitle: Blog\ndescription: Articles and thoughts about various topics.\nicon: Rss\n---';
    try {
      const currentIndexContent = await fs.readFile(INDEX_MDX_FILE, 'utf-8');
      const frontmatterMatch = currentIndexContent.match(/^---([\s\S]*?)---/);
      if (frontmatterMatch && frontmatterMatch[0]) {
        currentFileFrontmatter = frontmatterMatch[0];
        console.log('Preserving existing frontmatter from index.mdx');
      }
    } catch (error) {
      console.warn('Could not read existing index.mdx or parse its frontmatter. Using default frontmatter.');
    }

    // Update date field in frontmatter
    currentFileFrontmatter = updateFrontmatterDate(currentFileFrontmatter);

    let mdxContent = `${currentFileFrontmatter}\n\n`;

    const createCard = (article: ProcessedArticle): string => {
      const iconString = getIconComponentString(article.frontmatterIcon);
      const iconProp = iconString ? `icon={${iconString}}` : '';
      
      // Escape only double quotes in title for JSX attribute
      const escapedTitle = (article.title || '').replace(/"/g, '&quot;');

      // Content of the card - should be raw, as it might be MDX
      const cardContent = article.date || article.description || ''; 
      
      // Ensure there's a space before href if iconProp is present and not empty
      const finalIconProp = iconProp ? `${iconProp} ` : '';

      const href = BLOG_PREFIX ? `./${BLOG_PREFIX}/${article.slug}` : `./${article.slug}`;
      return `  <ZiaCard ${finalIconProp}href="${href}" title="${escapedTitle}">\n    ${cardContent}\n  </ZiaCard>\n`;
    };

    if (featuredArticles.length > 0) {
      mdxContent += `## Feature List\n\n<Cards>\n`;
      featuredArticles.forEach(article => { mdxContent += createCard(article); });
      mdxContent += `</Cards>\n\n`;
    }

    if (pastArticles.length > 0) {
      mdxContent += `## Past List\n\n<Cards>\n`;
      pastArticles.forEach(article => { mdxContent += createCard(article); });
      mdxContent += `</Cards>\n`;
    }

    // 单独添加 Monthly Summary 区块
    if (iocArticle) {
      mdxContent += `\n## Monthly Summary\n\n<Cards>\n`;
      const iocHref = BLOG_PREFIX ? `./${BLOG_PREFIX}/${IOC_SLUG}` : `./${IOC_SLUG}`;
      mdxContent += `  <ZiaCard href="${iocHref}" title="Overview">\n    ${getCurrentDateString()}\n  </ZiaCard>\n`;
      mdxContent += `</Cards>\n`;
    }

    if (featuredArticles.length === 0 && pastArticles.length === 0 && !iocArticle) {
      mdxContent += "No blog posts found yet. Stay tuned!\n";
    }

    await fs.writeFile(INDEX_MDX_FILE, mdxContent);
    console.log(`Successfully generated ${INDEX_MDX_FILE}`);

  } catch (error) {
    console.error('Error generating blog index:', error);
  }
}

/**
 * 生成博客月刊统计明细，输出到 src/mdx/blog/ioc.mdx
 * 1. 按 date 字段提取年月分组，组内按日期倒序
 * 2. 输出 FumaDocs <Files><Folder name="YYYY-MM"><File name="YYYY-MM-DD(Title)" /></Folder></Files> 结构
 */
async function generateMonthlyBlogSummary() {
  // 读取所有文章
  const articles = await getAllBlogArticles();
  // 过滤掉没有 date 的文章和 slug 为 ioc 的文章
  const articlesWithDate = articles.filter(a => a.date && a.slug !== IOC_SLUG);

  // 按月分组
  const monthMap: Record<string, {date: string, title: string}[]> = {};
  for (const art of articlesWithDate) {
    // 只取前7位 yyyy-mm
    const month = art.date!.slice(0, 7);
    if (!monthMap[month]) monthMap[month] = [];
    monthMap[month].push({ date: art.date!, title: art.title });
  }

  // 月份倒序排列
  const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));

  // 每月内文章按日期倒序
  for (const month of sortedMonths) {
    monthMap[month].sort((a, b) => b.date.localeCompare(a.date));
  }

  // 读取 ioc.mdx 原 frontmatter
  let frontmatter = '';
  try {
    const content = await fs.readFile(IOC_MDX_FILE, 'utf-8');
    const match = content.match(/^---([\s\S]*?)---/);
    if (match && match[0]) frontmatter = match[0];
  } catch {}

  // 如果没有 frontmatter，使用默认的
  if (!frontmatter) {
    frontmatter = '---\ntitle: Monthly Summary\ndescription: Index and Summary\n---';
  }

  // 更新 frontmatter 中的 date 字段
  frontmatter = updateFrontmatterDate(frontmatter);

  // 生成内容
  let mdx = `${frontmatter}\n\n\n## Overview\n<Files>\n`;
  if (sortedMonths.length === 0) {
    mdx += '  <File name="Comming Soon" className="opacity-50" disabled/>\n';
  } else {
    for (const month of sortedMonths) {
      // Folder 名称格式 YYYY-MM(文章数量)
      const count = monthMap[month].length;
      const folderTitle = `${month}(${count})`;
      // 默认展开最新月份
      const defaultOpen = month === sortedMonths[0] ? ' defaultOpen' : '';
      mdx += `  <Folder name="${folderTitle}"${defaultOpen}>\n`;
      for (const art of monthMap[month]) {
        // File name="YYYY-MM-DD(Title)"
        const day = art.date.slice(0, 10);
        mdx += `    <File name="${day}(${art.title})" />\n`;
      }
      mdx += `  </Folder>\n`;
    }
  }
  mdx += '</Files>\n\n';

  await fs.writeFile(IOC_MDX_FILE, mdx);
  console.log(`Successfully generated Monthly Blog Summary: ${IOC_MDX_FILE}`);
}

generateMonthlyBlogSummary();
generateBlogIndex();

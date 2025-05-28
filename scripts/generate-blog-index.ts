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
    
    const featuredSlugs = meta.pages
      .map(p => p.endsWith('.mdx') ? p.slice(0, -4) : p)
      .filter(slug => slug !== 'index' && slug !== '...');
    console.log('Featured slugs (meta-config):', featuredSlugs);

    const allArticles = await getAllBlogArticles();
    console.log(`Found ${allArticles.length} all articles.`);

    if (allArticles.length === 0 && featuredSlugs.length === 0) {
      console.warn("No articles found or featured. The generated index might be empty or minimal.");
    }

    const featuredArticles: ProcessedArticle[] = [];
    const pastArticles: ProcessedArticle[] = [];

    allArticles.forEach(article => {
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

      return `  <ZiaCard ${finalIconProp}href="${article.href}" title="${escapedTitle}">\n    ${cardContent}\n  </ZiaCard>\n`;
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

    if (featuredArticles.length === 0 && pastArticles.length === 0) {
      mdxContent += "No blog posts found yet. Stay tuned!\n";
    }

    await fs.writeFile(INDEX_MDX_FILE, mdxContent);
    console.log(`Successfully generated ${INDEX_MDX_FILE}`);

  } catch (error) {
    console.error('Error generating blog index:', error);
  }
}

generateBlogIndex();

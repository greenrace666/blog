import type { z } from "zod";
import matter from 'gray-matter';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { renderMarkdown } from '@astrojs/markdown-remark';

interface Post<T extends z.ZodType> {
  frontmatter: z.infer<T>;
  content: string;
}

interface PostList<T extends z.ZodType> {
  slug: string;
  frontmatter: z.infer<T>;
}

export async function readOne<T extends z.ZodType>({ 
  directory, 
  slug,
  frontmatterSchema 
}: {
  directory: string;
  slug: string;
  frontmatterSchema: T;
}): Promise<Post<T>> {
  // Try HTML first, fallback to MD
  let raw: string;
  let isMarkdown = false;
  try {
    raw = await fs.readFile(
      path.join(process.cwd(), 'content', directory, `${slug}.html`),
      'utf-8'
    );
  } catch (e) {
    raw = await fs.readFile(
      path.join(process.cwd(), 'content', directory, `${slug}.md`),
      'utf-8'
    );
    isMarkdown = true;
  }
  
  const { data: frontmatter, content } = matter(raw);
  
  // Validate frontmatter
  const validatedFrontmatter = frontmatterSchema.parse(frontmatter);

  // Convert markdown to HTML if it's a markdown file
  const processedContent = isMarkdown 
    ? (await renderMarkdown(content, {
        // Convert the path to a URL as required by the renderMarkdown function
        contentDir: new URL(`file://${path.join(process.cwd(), 'content')}`),
        remarkPlugins: [],
        rehypePlugins: [],
      })).code
    : content;

  return {
    frontmatter: validatedFrontmatter,
    content: processedContent
  };
}

export async function readAll<T extends z.ZodType>({ 
  directory,
  frontmatterSchema 
}: {
  directory: string;
  frontmatterSchema: T;
}): Promise<PostList<T>[]> {
  const dirPath = path.join(process.cwd(), 'content', directory);
  const files = await fs.readdir(dirPath);
  
  // Get both HTML and MD files
  const contentFiles = files.filter((file: string) => 
    path.extname(file) === '.html' || path.extname(file) === '.md'
  );

  const posts = await Promise.all(
    contentFiles.map(async (file: string) => {
      const raw = await fs.readFile(path.join(dirPath, file), 'utf-8');
      const { data: frontmatter } = matter(raw);
      const validatedFrontmatter = frontmatterSchema.parse(frontmatter);
      
      return {
        slug: path.basename(file, path.extname(file)),
        frontmatter: validatedFrontmatter
      };
    })
  );

  return posts;
}

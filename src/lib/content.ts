import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import type { z } from "zod";

export async function readOne<T extends z.ZodType>({ 
  directory, 
  slug,
  frontmatterSchema 
}: {
  directory: string;
  slug: string;
  frontmatterSchema: T;
}) {
  const raw = await fs.readFile(
    path.join(process.cwd(), 'content', directory, `${slug}.html`),
    'utf-8'
  );
  const { data: frontmatter, content } = matter(raw);
  
  // Validate frontmatter
  const validatedFrontmatter = frontmatterSchema.parse(frontmatter);

  return {
    frontmatter: validatedFrontmatter,
    content
  };
}

export async function readAll<T extends z.ZodType>({ 
  directory,
  frontmatterSchema 
}: {
  directory: string;
  frontmatterSchema: T;
}) {
  const dirPath = path.join(process.cwd(), 'content', directory);
  const files = await fs.readdir(dirPath);
  const htmlFiles = files.filter(file => path.extname(file) === '.html');

  const posts = await Promise.all(
    htmlFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(dirPath, file), 'utf-8');
      const { data: frontmatter } = matter(raw);
      const validatedFrontmatter = frontmatterSchema.parse(frontmatter);
      
      return {
        slug: path.basename(file, '.html'),
        frontmatter: validatedFrontmatter
      };
    })
  );

  return posts;
}

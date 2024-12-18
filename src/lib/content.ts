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
  // Try HTML first, fallback to MD
  let raw;
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
  }
  
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
  
  // Get both HTML and MD files
  const contentFiles = files.filter(file => 
    path.extname(file) === '.html' || path.extname(file) === '.md'
  );

  const posts = await Promise.all(
    contentFiles.map(async (file) => {
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

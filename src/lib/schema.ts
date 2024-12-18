import { z } from "zod";

export const blog = z.object({
  external: z.boolean().optional(),
  draft: z.boolean().optional(),
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  ogImagePath: z.string().optional(),
  canonicalUrl: z.string().optional()
});

export const project = z.object({
  draft: z.boolean().optional(),
  title: z.string(),
  description: z.string().optional(),
  date: z.date(),
  url: z.string().url()
});

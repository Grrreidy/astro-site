import { defineCollection } from 'astro:content';
import * as z from 'zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
    generateId: ({ entry }: { entry: string }) => entry.replace(/\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().optional(),
    image: z.string().optional(),
    author: z.string().optional(),
  }),
});

const external = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/external' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    url: z.string().url(),
  }),
});

export const collections = { blog, external };

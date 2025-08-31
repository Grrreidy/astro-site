import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    image: z.string().optional(),      // simplified image field
    author: z.string().optional(),
    draft: z.boolean().optional(),     // draft flag
  }),
});

const external = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    url: z.string().url(),
  }),
});

export const collections = { blog, external };

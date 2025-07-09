import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.object({
      src: z.string(),
      width: z.number(),
      height: z.number(),
      format: z.string(),
    }).optional(),
  }),
});

export const collections = {
  blog,
};

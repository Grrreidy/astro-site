import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z
      .object({
        src: z.string(),
        width: z.number(),
        height: z.number(),
        format: z.enum([
          'png',
          'jpg',
          'jpeg',
          'tiff',
          'webp',
          'gif',
          'svg',
          'avif',
        ]),
      })
      .optional(),
  }),
});

const external = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    url: z.string().url(),
  }),
});

export const collections = { blog, external };

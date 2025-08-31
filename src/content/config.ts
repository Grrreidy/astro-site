import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),        // <-- coerce string → Date
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().optional(),
    heroImage: z.object({
      src: z.string(),
      width: z.number(),
      height: z.number(),
      format: z.enum(['png','jpg','jpeg','tiff','webp','gif','svg','avif']),
    }).optional(),
  }),
});

const external = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),        // <-- coerce here too if you use it
    url: z.string().url(),
  }),
});

export const collections = { blog, external };

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  // 🚫 NO loader – Astro generates slug automatically
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
    }),
});

const external = defineCollection({
  // ✅ Keep loader here – external posts don’t generate pages
  loader: glob({ base: './src/content/external', pattern: '**/*.{md,mdx}' }),
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      url: z.string().url(),
    }),
});

export const collections = {
  blog,
  external,
};

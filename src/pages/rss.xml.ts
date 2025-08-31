// src/pages/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const now = new Date();

  const posts = (await getCollection('blog'))
    .filter((post) => !('draft' in post.data) || post.data.draft !== true)
    .filter((post) => {
      const d = post.data.pubDate;
      const valid = d instanceof Date && !Number.isNaN(d.valueOf());
      // exclude only if the date is valid AND in the future
      return !(valid && d > now);
    })
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Geri Reid',
    description: 'Accessibility, design systems, and UX',
    site: context.site ?? 'https://gerireid.com', // ensure astro.config.mjs has: site: 'https://gerireid.com'
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.slug}`,
    })),
  });
}

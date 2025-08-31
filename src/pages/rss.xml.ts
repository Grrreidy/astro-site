import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const now = new Date();
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.draft !== true)
    .filter((p) => !(p.data.pubDate instanceof Date && p.data.pubDate > now))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Geri Reid',
    description: 'Accessibility, design systems, and UX',
    site: context.site, // should be set to https://gerireid.com in astro.config.mjs
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/blog/${p.slug}`,
    })),
    customData: [
      `<language>en-gb</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<ttl>60</ttl>`,
      `<atom:link href="${new URL('/rss.xml', context.site)}" rel="self" type="application/rss+xml" />`,
      `<generator>Astro RSS generator</generator>`
    ].join(''),
  });
}

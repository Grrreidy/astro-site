import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET({ site }: APIContext) {
  const now = new Date();

  const posts = await getCollection(
    'blog',
    ({ data }: { data: { draft?: boolean; pubDate: Date; [key: string]: any } }) =>
      import.meta.env.DEV ||
      (!data.draft && new Date(data.pubDate).valueOf() <= now.valueOf())
  );

  return rss({
    title: 'Geri Reid',
    description: 'Accessibility, design systems, and UX',
    site: site!, // set in astro.config.mjs
    items: posts
      .sort(
        (
          a: { data: { pubDate: Date } },
          b: { data: { pubDate: Date } }
        ) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
      )
      .map((p: { data: { title: string; description: string; pubDate: Date }; slug: string }) => ({
        title: p.data.title,
        description: p.data.description,
        pubDate: p.data.pubDate,
        link: `/blog/${p.slug}`,
      })),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
    },
    customData: [
      `<language>en-gb</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<ttl>60</ttl>`,
      `<atom:link href="${new URL('/rss.xml', site!)}" rel="self" type="application/rss+xml" />`,
    ].join(''),
  });
}

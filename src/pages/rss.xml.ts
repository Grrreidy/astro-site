import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET({ site }: APIContext) {
  const now = new Date();

  // Only include non-draft, non-future posts
  const posts = await getCollection(
    'blog',
    ({ data }) => new Date(data.pubDate).valueOf() <= now.valueOf()
  );

  // Prepare items with full HTML content
  const items = await Promise.all(
    posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map(async (p) => {
        const rendered = await p.render(); // render MD/MDX
        // Use the rendered HTML if available (falls back to empty string)
        let html = rendered?.Content ? await rendered.Content({}, {}, {}) : '';

        // Ensure html is a string before using .replace
        if (typeof html !== 'string') {
          html = String(html);
        }

        // Ensure links and image src are absolute for feed readers
        const base = new URL('/', site!);
        const absolutised = html
          .replace(/href="\/(?!\/)/g, `href="${base}`)
          .replace(/src="\/(?!\/)/g, `src="${base}`);

        return {
          title: p.data.title,
          description: p.data.description,
          pubDate: p.data.pubDate,
          link: new URL(`/blog/${p.slug}`, site!).toString(), // absolute URL is safer
          content: absolutised, // full content
        };
      })
  );

  return rss({
    title: 'Geri Reid',
    description: 'Accessibility, design systems, and UX',
    site: site!,
    items,
    // Namespaces for Atom (self-link) and content:encoded (full HTML)
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    customData: [
      `<language>en-gb</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<ttl>60</ttl>`,
      `<atom:link href="${new URL('/rss.xml', site!)}" rel="self" type="application/rss+xml" />`,
    ].join(''),
  });
}

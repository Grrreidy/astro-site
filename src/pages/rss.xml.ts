import rss from '@astrojs/rss'; // keep as-is
import { getCollection, type CollectionEntry } from 'astro:content';
import MarkdownIt from 'markdown-it';
import type { APIContext } from 'astro';

type BlogEntry = CollectionEntry<'blog'>;

// create a MarkdownIt instance with types
const md: MarkdownIt = new MarkdownIt({ html: true, linkify: true });

export async function GET({ site }: APIContext) {
  const now = new Date();

  // non-draft, not future-dated
  const posts: BlogEntry[] = await getCollection(
    'blog',
    (entry: BlogEntry) =>
      !entry.data.draft && new Date(entry.data.pubDate).valueOf() <= now.valueOf()
  );

  const items = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((p) => {
      // render Markdown to HTML
      const html: string = md.render(p.body);

      // make relative URLs absolute for feed readers
      const base = new URL('/', site!);
      const absolutised = html
        .replace(/href="\/(?!\/)/g, `href="${base}`)
        .replace(/src="\/(?!\/)/g, `src="${base}`);

      return {
        title: p.data.title,
        description: p.data.description,
        pubDate: p.data.pubDate,
        link: new URL(`/blog/${p.slug}`, site!).toString(),
        content: absolutised,
      };
    });

  return rss({
    title: 'Geri Reid',
    description: 'Accessibility, design systems, and UX',
    site: site!,
    items,
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

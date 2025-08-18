import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
  // 1) Load posts (optionally ignore drafts)
  const blog = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => +new Date(b.data.pubDate) - +new Date(a.data.pubDate));

  const site = 'https://gerireid.com';
  const lastBuildDate = new Date().toUTCString();

  // 2) Build the feed
  const feed = rss({
    title: 'Geri Reid Blog',
    description: 'Writing on accessibility, design systems, and UX.',
    site,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}`,
      // stable GUID so readers detect updates correctly
      customData: `<guid isPermaLink="true">${site}/blog/${post.slug}</guid>`,
    })),
    // 3) Global RSS extras
    customData: [
      `<language>en-gb</language>`,
      `<lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      // optional: suggest refresh cadence to some readers (not universally honoured)
      `<ttl>10</ttl>`
    ].join('\n')
  });

  // 4) Encourage CDN/clients to re-fetch regularly
  feed.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');
  // If you prefer no caching at all, use:
  // feed.headers.set('Cache-Control', 'no-store');

  return feed;
}

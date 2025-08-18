import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
  // 1) Load posts, ignore drafts if present
  const all = await getCollection('blog');
  const blog = all
    .filter(({ data }) => !('draft' in data && (data as any).draft === true))
    // newest first
    .sort((a, b) => +new Date(b.data.pubDate) - +new Date(a.data.pubDate));

  const site = 'https://gerireid.com';
  const lastBuildDate = new Date().toUTCString();

  // 2) Build the feed
  const feed = await rss({
    title: 'Geri Reid Blog',
    description: 'Writing on accessibility, design systems, and UX.',
    site,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}`,
      customData: `<guid isPermaLink="true">${site}/blog/${post.slug}</guid>`,
    })),
    customData: [
      `<language>en-gb</language>`,
      `<lastBuildDate>${lastBuildDate}</lastBuildDate>`,
      `<ttl>10</ttl>`
    ].join('\n')
  });

  // 3) Cache headers
  feed.headers.set('Cache-Control', 'public, max-age=0, s-maxage=300, must-revalidate');
  return feed;
}

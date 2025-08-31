import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  // Load internal blog posts only
  const posts = (await getCollection('blog'))
    // hide drafts in production feed
    .filter((post) => post.data.draft !== true)
    // hide future-dated posts
    .filter((post) => post.data.pubDate <= new Date())
    // newest first
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Geri Reid',
    description: 'Accessibility, design systems, and UX',
    site: context.site, // e.g. https://gerireid.netlify.app
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.slug}`,
    })),
    stylesheet: '/rss/styles.xsl', 
  });
}

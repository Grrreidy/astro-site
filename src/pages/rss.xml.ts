import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
  const blog = await getCollection('blog');
  return rss({
    title: 'Geri Reid Blog',
    description: 'Writing on accessibility, design systems, and UX.',
    site: 'https://gerireid.com',
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}`,
    })),
  });
}

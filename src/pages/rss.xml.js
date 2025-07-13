import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog');

  return rss({
    title: 'Geri Reid – Blog',
    description: 'Writing about accessibility, design systems, and UX.',
    site: 'https://gerireid.netlify.app', // Replace with your live domain
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}`, 
    })),
    customData: `<language>en</language>`,
  });
}

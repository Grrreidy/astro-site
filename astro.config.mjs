import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'http://localhost:4321',
  integrations: [mdx(), sitemap()],
  content: {
    config: './src/content/config.ts',
  },
});

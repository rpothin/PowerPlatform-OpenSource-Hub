import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://rpothin.github.io',
  base: '/PowerPlatform-OpenSource-Hub',
  integrations: [
    tailwind(),
    mdx(),
  ],
  output: 'static',
});

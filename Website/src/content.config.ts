import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guidance = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guidance' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { guidance };

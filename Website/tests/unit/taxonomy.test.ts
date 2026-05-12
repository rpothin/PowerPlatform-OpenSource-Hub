import { existsSync } from 'fs';
import path from 'path';

import { categories } from '../../src/data/taxonomy';

describe('taxonomy documentation coverage', () => {
  it('has a category documentation page for every category taxonomy value', () => {
    const categoryDocsDir = path.join(process.cwd(), 'docs', 'categories');

    categories.forEach((category) => {
      expect(existsSync(path.join(categoryDocsDir, `${category.value}.mdx`))).toBe(true);
    });
  });
});

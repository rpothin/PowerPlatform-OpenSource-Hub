import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { relative, sep } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [mdsvex({ extensions: ['.md'] })],
	compilerOptions: {
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');
			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		adapter: adapter({ fallback: undefined }),
		paths: { base: '' }
	}
};

export default config;

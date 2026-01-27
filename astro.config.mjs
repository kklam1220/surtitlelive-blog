// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://surtitlelive.com',
	base: '/blog/',
	output: 'static',
	integrations: [mdx(), sitemap()],
	// Cloudflare Pages adapter (commented out for static builds, uncomment if using SSR)
	// adapter: cloudflare(),
});

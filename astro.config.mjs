// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const BLOG_INDEXED_LOCALES = new Set(['en', 'de', 'es', 'fr', 'ja', 'ko', 'zh-TW']);
const BLOG_SECONDARY_LOCALES = new Set(['ar', 'id', 'it', 'pl', 'pt', 'ru', 'th', 'tr', 'uk', 'vi', 'zh-CN']);
const BLOG_ALL_LOCALE_INDEXED_SLUGS = new Set(['9-english-surtitles-non-english-show-fringe']);

function shouldEmitSitemapPage(page) {
	const { pathname } = new URL(page);
	const segments = pathname.split('/').filter(Boolean);
	const maybeLocale = segments[1];

	if (segments[0] !== 'blog' || !maybeLocale) {
		return true;
	}

	const isLocaleSegment = BLOG_INDEXED_LOCALES.has(maybeLocale) || BLOG_SECONDARY_LOCALES.has(maybeLocale);
	if (!isLocaleSegment) {
		return true;
	}

	const maybeSlug = segments[2];
	if (maybeSlug && BLOG_ALL_LOCALE_INDEXED_SLUGS.has(maybeSlug)) {
		return true;
	}

	if (BLOG_SECONDARY_LOCALES.has(maybeLocale)) {
		return false;
	}

	return !maybeLocale || BLOG_INDEXED_LOCALES.has(maybeLocale);
}

// https://astro.build/config
export default defineConfig({
	site: 'https://surtitlelive.com',
	base: '/blog/',
	output: 'static',
	integrations: [mdx(), sitemap({ filter: shouldEmitSitemapPage })],
});

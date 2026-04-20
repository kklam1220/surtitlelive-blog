export const SUPPORTED_BLOG_LOCALES = [
	'ar',
	'de',
	'en',
	'es',
	'fr',
	'id',
	'it',
	'ja',
	'ko',
	'pl',
	'pt',
	'ru',
	'th',
	'tr',
	'uk',
	'vi',
	'zh-CN',
	'zh-TW',
] as const;

export type BlogSupportedLocale = (typeof SUPPORTED_BLOG_LOCALES)[number];

export interface BlogLocaleMeta {
	native: string;
	flag: string;
	dir: 'ltr' | 'rtl';
}

export const BLOG_LOCALE_META: Record<BlogSupportedLocale, BlogLocaleMeta> = {
	ar: { native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
	de: { native: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
	en: { native: 'English', flag: '🇬🇧', dir: 'ltr' },
	es: { native: 'Español', flag: '🇪🇸', dir: 'ltr' },
	fr: { native: 'Français', flag: '🇫🇷', dir: 'ltr' },
	id: { native: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
	it: { native: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
	ja: { native: '日本語', flag: '🇯🇵', dir: 'ltr' },
	ko: { native: '한국어', flag: '🇰🇷', dir: 'ltr' },
	pl: { native: 'Polski', flag: '🇵🇱', dir: 'ltr' },
	pt: { native: 'Português', flag: '🇵🇹', dir: 'ltr' },
	ru: { native: 'Русский', flag: '🇷🇺', dir: 'ltr' },
	th: { native: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
	tr: { native: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
	uk: { native: 'Українська', flag: '🇺🇦', dir: 'ltr' },
	vi: { native: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
	'zh-CN': { native: '简体中文', flag: '🇨🇳', dir: 'ltr' },
	'zh-TW': { native: '繁體中文', flag: '🇹🇼', dir: 'ltr' },
};

export function isBlogSupportedLocale(value: unknown): value is BlogSupportedLocale {
	return typeof value === 'string' && (SUPPORTED_BLOG_LOCALES as readonly string[]).includes(value);
}

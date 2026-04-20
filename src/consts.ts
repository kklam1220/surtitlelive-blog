// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'SurtitleLive Blog';
export const SITE_DESCRIPTION = 'News, tutorials, and insights about live subtitling and theatre technology.';
export const MAIN_SITE_URL = 'https://surtitlelive.com';

export function buildMainSiteHref(path = '/') {
	return new URL(path, MAIN_SITE_URL).toString();
}

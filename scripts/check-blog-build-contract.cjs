const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '..', 'dist');

function collectFiles(dir, predicate, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, predicate, acc);
      continue;
    }
    if (predicate(fullPath)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function assertNoMatch(files, pattern, message) {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (pattern.test(content)) {
      throw new Error(`${message}\nMatched in: ${path.relative(distDir, file)}`);
    }
  }
}

function assertHasMatch(files, pattern, message) {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (pattern.test(content)) {
      return;
    }
  }
  throw new Error(message);
}

function assertFileHasMatch(relativePath, pattern, message) {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected built blog file: ${relativePath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!pattern.test(content)) {
    throw new Error(`${message}\nChecked file: ${relativePath}`);
  }
}

function assertFileHasNoMatch(relativePath, pattern, message) {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected built blog file: ${relativePath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (pattern.test(content)) {
    throw new Error(`${message}\nMatched in file: ${relativePath}`);
  }
}

function assertFileMatchCount(relativePath, pattern, expectedCount, message) {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected built blog file: ${relativePath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(pattern) ?? [];
  if (matches.length !== expectedCount) {
    throw new Error(`${message}\nExpected ${expectedCount}, found ${matches.length} in file: ${relativePath}`);
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error('Blog dist/ does not exist. Run `npm run build --prefix blog` first.');
}

const htmlFiles = collectFiles(distDir, (file) => file.endsWith('.html'));
const cssFiles = collectFiles(distDir, (file) => file.endsWith('.css'));
const xmlFiles = collectFiles(distDir, (file) => file.endsWith('.xml'));
const textFiles = [...htmlFiles, ...cssFiles, ...xmlFiles];
const redirectsFile = path.join(distDir, '_redirects');

assertNoMatch(
  textFiles,
  /\/blog\/blog\/fonts\/atkinson-(regular|bold)\.woff/,
  'Detected double-prefixed blog font URL.',
);

assertNoMatch(
  textFiles,
  /\$\{(?:regularFontUrl|boldFontUrl)\}/,
  'Detected unresolved font template placeholder in built blog output.',
);

assertHasMatch(
  textFiles,
  /(?:https:\/\/surtitlelive\.com)?\/blog\/fonts\/atkinson-regular\.woff/,
  'Missing canonical regular font URL in built blog output.',
);

assertHasMatch(
  textFiles,
  /(?:https:\/\/surtitlelive\.com)?\/blog\/fonts\/atkinson-bold\.woff/,
  'Missing canonical bold font URL in built blog output.',
);

assertNoMatch(
  textFiles,
  /src:url\(\/fonts\/atkinson-(regular|bold)\.woff\)/,
  'Detected root-only font URL in built blog CSS.',
);

assertNoMatch(
  htmlFiles,
  /https:\/\/www\.surtitlelive\.com/,
  'Detected deprecated www.surtitlelive.com host in built blog HTML.',
);

assertNoMatch(
  textFiles,
  /Machine-translated|English text prevails|SurtitleLive Blog \([a-z][a-z-]*\)|>Blog \([a-z][a-z-]*\)</i,
  'Detected informal localized blog copy or locale-code labels in built blog output.',
);

assertNoMatch(
  htmlFiles,
  /src="\/blog\/logo\/New_logo\.png/,
  'Detected blog-origin logo URL. Use the canonical main-site logo URL instead.',
);

assertHasMatch(
  htmlFiles,
  /src="https:\/\/surtitlelive\.com\/logo\/New_logo\.png"/,
  'Missing canonical main-site logo URL in built blog HTML.',
);

if (!fs.existsSync(redirectsFile)) {
  throw new Error('Missing Cloudflare Pages _redirects file in built blog output.');
}

const redirectsContent = fs.readFileSync(redirectsFile, 'utf8');
for (const requiredRule of [
  '/blog/_astro/* /_astro/:splat 200',
  '/blog/fonts/* /blog/fonts/:splat 200',
  '/blog/logo/* /blog/logo/:splat 200',
  '/blog/:locale/3-how-we-protect-your-work/ /blog/3-how-we-protect-your-work/ 302',
  '/:locale/3-how-we-protect-your-work/ /blog/3-how-we-protect-your-work/ 302',
  '/blog/:locale/:slug/ /:locale/:slug/ 200',
  '/blog/:slug/ /:slug/ 200',
  '/blog/ / 200',
]) {
  if (!redirectsContent.includes(requiredRule)) {
    throw new Error(`Missing required Pages redirect rule: ${requiredRule}`);
  }
}

for (const articlePath of [
  path.join('7-geometry-of-dramatic-parsing', 'index.html'),
  path.join('zh-CN', '7-geometry-of-dramatic-parsing', 'index.html'),
]) {
  assertFileHasNoMatch(
    articlePath,
    /<meta property="og:image" content="[^"]*blog-placeholder-1/i,
    'Detected placeholder preview image on a hero-image article page.',
  );
  assertFileHasMatch(
    articlePath,
    /<meta property="og:image" content="[^"]*script-parsing-theatre-subtitles/i,
    'Missing article-specific preview image on a hero-image article page.',
  );
}

assertFileMatchCount(
  path.join('8-from-layout-to-archetype-detection', 'index.html'),
  />FAQ<\/h2>/g,
  1,
  'Detected duplicate FAQ headings on the deterministic parsing article.',
);

assertFileHasNoMatch(
  path.join('8-from-layout-to-archetype-detection', 'index.html'),
  />Key Takeaways<\/h2>|Why is deterministic parsing important for theatre subtitles\?/,
  'Detected generated GEO block on an article that already has an authored FAQ section.',
);

assertFileHasMatch(
  path.join('ko', 'index.html'),
  /SurtitleLive 블로그|추천 글/,
  'Missing formal Korean blog hub metadata or heading.',
);

for (const locale of [
  'ar',
  'de',
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
]) {
  const deferredPath = path.join(distDir, locale, '3-how-we-protect-your-work', 'index.html');
  if (fs.existsSync(deferredPath)) {
    throw new Error(
      `Deferred localized security/IP article leaked into built blog output: ${deferredPath}`,
    );
  }
}

assertNoMatch(
  textFiles,
  /\/(ar|de|es|fr|id|it|ja|ko|pl|pt|ru|th|tr|uk|vi|zh-CN|zh-TW)\/3-how-we-protect-your-work\//,
  'Deferred localized security/IP article leaked into built blog output links.',
);

assertFileHasNoMatch(
  path.join('ko', '7-geometry-of-dramatic-parsing', 'index.html'),
  /Zhang San|Li Si|張三：今天下雨/,
  'Detected non-localized Chinese/English example text on the Korean parsing article.',
);

console.log('Blog build contract check passed.');

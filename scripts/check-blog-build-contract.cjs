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

if (!fs.existsSync(distDir)) {
  throw new Error('Blog dist/ does not exist. Run `npm run build --prefix blog` first.');
}

const htmlFiles = collectFiles(distDir, (file) => file.endsWith('.html'));
const cssFiles = collectFiles(distDir, (file) => file.endsWith('.css'));
const textFiles = [...htmlFiles, ...cssFiles];
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
  htmlFiles,
  /src="\/logo\/New_logo\.png"/,
  'Detected non-base-aware logo path in built blog HTML.',
);

if (!fs.existsSync(redirectsFile)) {
  throw new Error('Missing Cloudflare Pages _redirects file in built blog output.');
}

const redirectsContent = fs.readFileSync(redirectsFile, 'utf8');
for (const requiredRule of [
  '/blog/_astro/* /_astro/:splat 200',
  '/blog/fonts/* /blog/fonts/:splat 200',
  '/blog/logo/* /blog/logo/:splat 200',
  '/blog/:locale/:slug/ /:locale/:slug/ 200',
  '/blog/:slug/ /:slug/ 200',
  '/blog/ / 200',
]) {
  if (!redirectsContent.includes(requiredRule)) {
    throw new Error(`Missing required Pages redirect rule: ${requiredRule}`);
  }
}

console.log('Blog build contract check passed.');

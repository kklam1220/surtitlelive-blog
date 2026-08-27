const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const {
  PUBLIC_EMAIL_OUTPUT_PATHS,
  SAFE_PUBLIC_EMAIL_HTML,
  rewritePublicEmailDocument,
} = require("./rewrite-public-email-links.cjs");

const distDir = path.resolve(__dirname, "..", "dist");
const blogRoot = path.resolve(__dirname, "..");
const astroConfigPath = path.join(blogRoot, "astro.config.mjs");
const localeConfigPath = path.join(blogRoot, "src", "i18n", "locale-config.ts");
const qlabDemoScriptPath = path.join(
  blogRoot,
  "qlab-subtitles-demo-assets",
  "create-qlab-subtitles-from-excel.applescript",
);
const qlabDemoZipPath = path.join(
  blogRoot,
  "public",
  "blog-13-qlab-subtitles-demo-assets.zip",
);
const qlabDemoZipEntry =
  "qlab-subtitles-demo-assets/create-qlab-subtitles-from-excel.applescript";

function extractQuotedValues(source, regex, label) {
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Missing ${label} policy declaration.`);
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]).sort();
}

function assertSameStringSet(actual, expected, message) {
  const actualText = actual.join(",");
  const expectedText = expected.join(",");
  if (actualText !== expectedText) {
    throw new Error(
      `${message}\nActual: ${actualText}\nExpected: ${expectedText}`,
    );
  }
}

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
    const content = fs.readFileSync(file, "utf8");
    if (pattern.test(content)) {
      throw new Error(
        `${message}\nMatched in: ${path.relative(distDir, file)}`,
      );
    }
  }
}

function assertHasMatch(files, pattern, message) {
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
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
  const content = fs.readFileSync(fullPath, "utf8");
  if (!pattern.test(content)) {
    throw new Error(`${message}\nChecked file: ${relativePath}`);
  }
}

function assertFileHasNoMatch(relativePath, pattern, message) {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected built blog file: ${relativePath}`);
  }
  const content = fs.readFileSync(fullPath, "utf8");
  if (pattern.test(content)) {
    throw new Error(`${message}\nMatched in file: ${relativePath}`);
  }
}

function assertFileMatchCount(relativePath, pattern, expectedCount, message) {
  const fullPath = path.join(distDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing expected built blog file: ${relativePath}`);
  }
  const content = fs.readFileSync(fullPath, "utf8");
  const matches = content.match(pattern) ?? [];
  if (matches.length !== expectedCount) {
    throw new Error(
      `${message}\nExpected ${expectedCount}, found ${matches.length} in file: ${relativePath}`,
    );
  }
}

function assertQlabDemoScriptTargetsActiveCueList(source, label) {
  if (!/set destinationCueList to current cue list/.test(source)) {
    throw new Error(`${label} does not capture QLab's active cue list.`);
  }
  if (/first cue list/.test(source)) {
    throw new Error(`${label} still targets QLab's first cue list.`);
  }
  const destinationUses =
    source.match(/makeCueInGroup\("group", destinationCueList\)/g) ?? [];
  if (destinationUses.length !== 2) {
    throw new Error(
      `${label} must route subtitle and final-clear Groups to the captured active cue list.`,
    );
  }
}

if (!fs.existsSync(distDir)) {
  throw new Error(
    "Blog dist/ does not exist. Run `npm run build --prefix blog` first.",
  );
}

assertQlabDemoScriptTargetsActiveCueList(
  fs.readFileSync(qlabDemoScriptPath, "utf8"),
  "QLab companion AppleScript source",
);
const zippedQlabDemoScript = execFileSync(
  "unzip",
  ["-p", qlabDemoZipPath, qlabDemoZipEntry],
  { encoding: "utf8" },
);
assertQlabDemoScriptTargetsActiveCueList(
  zippedQlabDemoScript,
  "QLab companion ZIP AppleScript",
);

const astroConfigSource = fs.readFileSync(astroConfigPath, "utf8");
const localeConfigSource = fs.readFileSync(localeConfigPath, "utf8");
assertSameStringSet(
  extractQuotedValues(
    astroConfigSource,
    /const BLOG_INDEXED_LOCALES = new Set\(\[([\s\S]*?)\]\);/,
    "Astro indexed-locale sitemap filter",
  ),
  extractQuotedValues(
    localeConfigSource,
    /export const BLOG_INDEXED_LOCALES = \[([\s\S]*?)\] as const/,
    "indexed blog locales",
  ),
  "Astro sitemap indexed-locale filter drifted from blog locale-config.",
);
assertSameStringSet(
  extractQuotedValues(
    astroConfigSource,
    /const BLOG_SECONDARY_LOCALES = new Set\(\[([\s\S]*?)\]\);/,
    "Astro secondary-locale sitemap filter",
  ),
  extractQuotedValues(
    localeConfigSource,
    /export const BLOG_SECONDARY_LOCALES = \[([\s\S]*?)\] as const/,
    "secondary blog locales",
  ),
  "Astro sitemap secondary-locale filter drifted from blog locale-config.",
);
assertSameStringSet(
  extractQuotedValues(
    astroConfigSource,
    /const BLOG_ALL_LOCALE_INDEXED_SLUGS = new Set\(\[([\s\S]*?)\]\);/,
    "Astro all-locale indexed slug filter",
  ),
  extractQuotedValues(
    localeConfigSource,
    /export const BLOG_ALL_LOCALE_INDEXED_SLUGS = \[([\s\S]*?)\] as const/,
    "all-locale indexed blog slugs",
  ),
  "Astro sitemap all-locale indexed slug filter drifted from blog locale-config.",
);

const htmlFiles = collectFiles(distDir, (file) => file.endsWith(".html"));
const cssFiles = collectFiles(distDir, (file) => file.endsWith(".css"));
const xmlFiles = collectFiles(distDir, (file) => file.endsWith(".xml"));
const textFiles = [...htmlFiles, ...cssFiles, ...xmlFiles];
const redirectsFile = path.join(distDir, "_redirects");
const headersFile = path.join(distDir, "_headers");
const sitemapText = xmlFiles
  .filter((file) => path.basename(file).startsWith("sitemap"))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const jsonLdCount = (
    content.match(/<script type="application\/ld\+json">/g) || []
  ).length;
  if (jsonLdCount > 1) {
    throw new Error(
      `Detected duplicate JSON-LD script blocks in built blog HTML: ${path.relative(distDir, filePath)}`,
    );
  }
}

assertNoMatch(
  textFiles,
  /\/blog\/blog\/fonts\/atkinson-(regular|bold)\.woff/,
  "Detected double-prefixed blog font URL.",
);

assertNoMatch(
  textFiles,
  /\$\{(?:regularFontUrl|boldFontUrl)\}/,
  "Detected unresolved font template placeholder in built blog output.",
);

assertHasMatch(
  textFiles,
  /(?:https:\/\/surtitlelive\.com)?\/blog\/fonts\/atkinson-regular\.woff/,
  "Missing canonical regular font URL in built blog output.",
);

assertHasMatch(
  textFiles,
  /(?:https:\/\/surtitlelive\.com)?\/blog\/fonts\/atkinson-bold\.woff/,
  "Missing canonical bold font URL in built blog output.",
);

assertNoMatch(
  textFiles,
  /src:url\(\/fonts\/atkinson-(regular|bold)\.woff\)/,
  "Detected root-only font URL in built blog CSS.",
);

assertNoMatch(
  htmlFiles,
  /https:\/\/www\.surtitlelive\.com/,
  "Detected deprecated www.surtitlelive.com host in built blog HTML.",
);

assertNoMatch(
  htmlFiles,
  /info@surtitlelive\.com|mailto:info@surtitlelive\.com|\/cdn-cgi\/l\/email-protection|data-cfemail/i,
  "Detected an email address that Cloudflare can rewrite into an internal /cdn-cgi 404.",
);

const publicEmailOutputFiles = new Set(
  PUBLIC_EMAIL_OUTPUT_PATHS.map((relativePath) =>
    path.join(distDir, relativePath),
  ),
);
const reviewedEmailFixture = [
  '<p><a href="mailto:info@surtitlelive.com">info@surtitlelive.com</a></p>',
  '<p><a href="mailto:info@surtitlelive.com">info@surtitlelive.com</a></p>',
].join("");
for (const unsafeFixture of [
  '<script type="application/ld+json">{"email":"info@surtitlelive.com"}</script>',
  '<script>const email="info@surtitlelive.com"</script>',
  '<meta content="info@surtitlelive.com">',
  '<a href="mailto:info@surtitlelive.com?subject=Help">Email</a>',
]) {
  assert.throws(
    () =>
      rewritePublicEmailDocument(
        `${reviewedEmailFixture}${unsafeFixture}`,
        "contract-fixture.html",
      ),
    /outside the reviewed article links/,
  );
}
const publicEmailPlaceholderPattern = new RegExp(
  SAFE_PUBLIC_EMAIL_HTML.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  "g",
);

for (const relativePath of PUBLIC_EMAIL_OUTPUT_PATHS) {
  assertFileMatchCount(
    relativePath,
    publicEmailPlaceholderPattern,
    2,
    "Each Fringe Support article must contain two SSR-safe public email placeholders.",
  );
  assertFileMatchCount(
    relativePath,
    /info \[at\] surtitlelive \[dot\] com/g,
    2,
    "Each Fringe Support article must keep two readable no-JavaScript email fallbacks.",
  );
  assertFileHasMatch(
    relativePath,
    /link\.href = `mailto:\$\{address\}`;[\s\S]*link\.textContent = address;/,
    "Fringe Support article is missing the client-side clickable email restoration.",
  );
}

assertNoMatch(
  htmlFiles.filter((file) => !publicEmailOutputFiles.has(file)),
  /<span class="stl-public-email" data-stl-email-local="info" data-stl-email-domain-parts="surtitlelive,com">/,
  "Detected the Fringe Support public email placeholder in an unrelated blog output.",
);

if (/https:\/\/blog\.surtitlelive\.com\/sitemap-index\.xml/.test(sitemapText)) {
  throw new Error(
    "Detected blog-origin sitemap host. Blog sitemap URLs must use apex /blog/*.",
  );
}

if (
  !sitemapText.includes(
    "https://surtitlelive.com/blog/7-geometry-of-dramatic-parsing/",
  )
) {
  throw new Error("Missing English blog article from sitemap.");
}

const archivedPockitleDemoArticle = "17-how-pockitle-live-caption-demo-works";
if (
  sitemapText.includes(
    `https://surtitlelive.com/blog/${archivedPockitleDemoArticle}/`,
  ) ||
  fs.existsSync(path.join(distDir, archivedPockitleDemoArticle, "index.html"))
) {
  throw new Error("Archived Pockitle demo article must not be published.");
}

for (const locale of [
  "ar",
  "de",
  "es",
  "fr",
  "id",
  "it",
  "ja",
  "ko",
  "pl",
  "pt",
  "ru",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-CN",
  "zh-TW",
]) {
  if (
    !sitemapText.includes(
      `https://surtitlelive.com/blog/${locale}/7-geometry-of-dramatic-parsing/`,
    )
  ) {
    throw new Error(
      `Missing reviewed localized blog article from sitemap: ${locale}/7-geometry-of-dramatic-parsing`,
    );
  }
}

assertNoMatch(
  textFiles,
  /Machine-translated|English text prevails|SurtitleLive Blog \([a-z][a-z-]*\)|>Blog \([a-z][a-z-]*\)</i,
  "Detected informal localized blog copy or locale-code labels in built blog output.",
);

assertNoMatch(
  htmlFiles,
  /<pre><code class="language-(markdown|md)">|```markdown|&lt;script type=(?:&quot;|")application\/ld\+json|&lt;script\s+type=(?:&quot;|")application\/ld\+json/i,
  "Detected escaped markdown fence or JSON-LD script rendered as article body content.",
);

assertNoMatch(
  htmlFiles,
  /import\s+[A-Za-z_$][\w$]*\s+from\s+(?:&#39;|')\.\/[^<]+?\.(?:avif|gif|jpe?g|png|webp)(?:&#39;|')|src=\{[A-Za-z_$][\w$]*\.src\}/i,
  "Detected unresolved MDX image import or image expression in built blog HTML.",
);

assertNoMatch(
  htmlFiles,
  /src="\.\/[^"]+\.(?:avif|gif|jpe?g|png|webp)"/i,
  "Detected unresolved relative article image URL in built blog HTML.",
);

assertNoMatch(
  htmlFiles,
  /<meta property="og:image" content="https:\/\/surtitlelive\.com\/blog\/(?:ar|de|es|fr|id|it|ja|ko|pl|pt|ru|th|tr|uk|vi|zh-CN|zh-TW)\/[^"]+\.(?:avif|gif|jpe?g|png|webp)"/i,
  "Detected localized preview image URL that bypasses the Astro asset pipeline.",
);

assertNoMatch(
  htmlFiles,
  /src="\/blog\/logo\/New_logo\.png/,
  "Detected blog-origin logo URL. Use the canonical main-site logo URL instead.",
);

assertHasMatch(
  htmlFiles,
  /src="https:\/\/surtitlelive\.com\/logo\/New_logo\.png"/,
  "Missing canonical main-site logo URL in built blog HTML.",
);

assertNoMatch(
  htmlFiles,
  /https:\/\/surtitlelive\.com\/logo\.png/,
  "Detected obsolete root logo URL. Use https://surtitlelive.com/logo/New_logo.png.",
);

assertHasMatch(
  htmlFiles,
  /"logo":\{"@type":"ImageObject","url":"https:\/\/surtitlelive\.com\/logo\/New_logo\.png"\}/,
  "Missing canonical publisher logo URL in BlogPosting JSON-LD.",
);

if (!fs.existsSync(redirectsFile)) {
  throw new Error(
    "Missing Cloudflare Pages _redirects file in built blog output.",
  );
}

if (!fs.existsSync(headersFile)) {
  throw new Error(
    "Missing Cloudflare Pages _headers file in built blog output.",
  );
}

const notFoundFile = path.join(distDir, "404.html");
if (!fs.existsSync(notFoundFile)) {
  throw new Error("Missing the static Cloudflare Pages 404 document.");
}
assertFileHasMatch(
  "404.html",
  /<meta name="robots" content="noindex, nofollow">/,
  "The blog 404 document must remain noindex and nofollow.",
);
assertFileHasMatch(
  "404.html",
  /Page not found/,
  "The blog 404 document is missing its user-facing title.",
);
assertFileHasNoMatch(
  "404.html",
  /<link rel="canonical" href="https:\/\/surtitlelive\.com\/blog\/">/,
  "The blog 404 document must not canonicalize unknown URLs to the blog homepage.",
);

const redirectsContent = fs.readFileSync(redirectsFile, "utf8");
const headersContent = fs.readFileSync(headersFile, "utf8");
for (const requiredRule of [
  "/blog/_astro/* /_astro/:splat 200",
  "/blog/fonts/* /blog/fonts/:splat 200",
  "/blog/logo/* /blog/logo/:splat 200",
  "/blog/:locale/rss.xml /:locale/rss.xml 200",
  "/blog/:locale/:slug/ https://surtitlelive.com/blog/:locale/:slug/ 301",
  "/blog/:locale/:slug https://surtitlelive.com/blog/:locale/:slug/ 301",
  "/blog/:locale/ https://surtitlelive.com/blog/:locale/ 301",
  "/blog/:locale https://surtitlelive.com/blog/:locale/ 301",
  "/blog/:slug/ https://surtitlelive.com/blog/:slug/ 301",
  "/blog/:slug https://surtitlelive.com/blog/:slug/ 301",
  "/blog/ https://surtitlelive.com/blog/ 301",
  "/blog https://surtitlelive.com/blog/ 301",
]) {
  if (!redirectsContent.includes(requiredRule)) {
    throw new Error(`Missing required Pages redirect rule: ${requiredRule}`);
  }
}

for (const forbiddenRule of [
  "/blog/:locale/:slug/ /:locale/:slug/ 200",
  "/blog/:locale/:slug /:locale/:slug 200",
  "/blog/:locale/ /:locale/ 200",
  "/blog/:locale /:locale 200",
  "/blog/:slug/ /:slug/ 200",
  "/blog/:slug /:slug 200",
  "/blog/ / 200",
  "/blog / 200",
  "/blog/:locale/3-how-we-protect-your-work/ https://surtitlelive.com/blog/3-how-we-protect-your-work/ 301",
  "/blog/:locale/3-how-we-protect-your-work https://surtitlelive.com/blog/3-how-we-protect-your-work/ 301",
  "/:locale/3-how-we-protect-your-work/ https://surtitlelive.com/blog/3-how-we-protect-your-work/ 301",
  "/:locale/3-how-we-protect-your-work https://surtitlelive.com/blog/3-how-we-protect-your-work/ 301",
]) {
  if (redirectsContent.includes(forbiddenRule)) {
    throw new Error(
      `Deprecated duplicate blog-origin HTML rewrite is still present: ${forbiddenRule}`,
    );
  }
}

for (const requiredHeaderRule of [
  "/*",
  "/blog/*",
  "X-Robots-Tag: noindex, follow",
]) {
  if (!headersContent.includes(requiredHeaderRule)) {
    throw new Error(
      `Missing required Pages header rule: ${requiredHeaderRule}`,
    );
  }
}

for (const articlePath of [
  path.join("7-geometry-of-dramatic-parsing", "index.html"),
  path.join("zh-CN", "7-geometry-of-dramatic-parsing", "index.html"),
  path.join("fr", "7-geometry-of-dramatic-parsing", "index.html"),
]) {
  assertFileHasNoMatch(
    articlePath,
    /<meta property="og:image" content="[^"]*blog-placeholder-1/i,
    "Detected placeholder preview image on a hero-image article page.",
  );
  assertFileHasMatch(
    articlePath,
    /<meta property="og:image" content="[^"]*script-parsing-theatre-subtitles/i,
    "Missing article-specific preview image on a hero-image article page.",
  );
  assertFileHasMatch(
    articlePath,
    /<div class="hero-image"[^>]*>[\s\S]*<img[^>]+src="\/blog\/_astro\/script-parsing-theatre-subtitles/i,
    "Missing rendered article-specific hero image on a hero-image article page.",
  );
}

assertFileHasMatch(
  path.join("es", "5-the-human-gatekeeper-ai-translation", "index.html"),
  /<img[^>]+src="\/blog\/_astro\/blog-5\.2/i,
  "Missing resolved localized body image on the Spanish AI translation article.",
);

assertFileHasMatch(
  path.join("es", "1-why-powerpoint-fails-theatre", "index.html"),
  /<img[^>]+src="\/blog\/_astro\/blog-1-2/i,
  "Missing resolved localized body image on the Spanish PowerPoint article.",
);

assertFileMatchCount(
  path.join("8-from-layout-to-archetype-detection", "index.html"),
  />FAQ<\/h2>/g,
  1,
  "Detected duplicate FAQ headings on the deterministic parsing article.",
);

assertFileHasNoMatch(
  path.join("8-from-layout-to-archetype-detection", "index.html"),
  />Key Takeaways<\/h2>|Why is deterministic parsing important for theatre subtitles\?/,
  "Detected generated GEO block on an article that already has an authored FAQ section.",
);

assertFileHasMatch(
  path.join("ko", "index.html"),
  /SurtitleLive 블로그|추천 글/,
  "Missing formal Korean blog hub metadata or heading.",
);

assertFileHasNoMatch(
  path.join("it", "7-geometry-of-dramatic-parsing", "index.html"),
  /<meta name="robots" content="noindex,follow">/,
  "A reviewed localized blog article must not remain noindexed.",
);

assertFileHasNoMatch(
  path.join("it", "9-english-surtitles-non-english-show-fringe", "index.html"),
  /<meta name="robots" content="noindex,follow">/,
  "A reviewed localized fringe surtitles article must not be noindexed.",
);

for (const [locale, expectedCopy] of [
  [
    "ko",
    { features: "기능", guides: "가이드", blog: "블로그", signUp: "회원가입" },
  ],
  [
    "zh-TW",
    { features: "功能", guides: "指南", blog: "部落格", signUp: "註冊" },
  ],
]) {
  const indexPath = path.join(locale, "index.html");

  assertFileHasMatch(
    indexPath,
    new RegExp(
      `href="https://surtitlelive\\.com/${locale}/features"[^>]*>\\s*${expectedCopy.features}\\s*<`,
    ),
    `Missing localized main-site Features href on the ${locale} blog header.`,
  );
  assertFileHasMatch(
    indexPath,
    new RegExp(
      `href="https://surtitlelive\\.com/${locale}/guides"[^>]*>\\s*${expectedCopy.guides}\\s*<`,
    ),
    `Missing localized main-site Guides href on the ${locale} blog header.`,
  );
  assertFileHasMatch(
    indexPath,
    new RegExp(`href="/blog/${locale}/"[^>]*>\\s*${expectedCopy.blog}\\s*<`),
    `Missing locale-preserving Blog href on the ${locale} blog header.`,
  );
  assertFileHasMatch(
    indexPath,
    new RegExp(
      `href="https://surtitlelive\\.com/auth/register"[^>]*>\\s*${expectedCopy.signUp}\\s*<`,
    ),
    `Missing account-registration sign-up copy on the ${locale} blog header.`,
  );
  assertFileHasNoMatch(
    indexPath,
    /href="https:\/\/surtitlelive\.com\/ja\//,
    `Detected Japanese main-site href leak on the ${locale} blog header.`,
  );
}

assertFileHasNoMatch(
  path.join("zh-TW", "index.html"),
  /報名/,
  "Detected event-registration wording on the Traditional Chinese blog header.",
);

for (const locale of [
  "ar",
  "de",
  "es",
  "fr",
  "id",
  "it",
  "ja",
  "ko",
  "pl",
  "pt",
  "ru",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-CN",
  "zh-TW",
]) {
  const reviewedPath = path.join(
    distDir,
    locale,
    "3-how-we-protect-your-work",
    "index.html",
  );
  if (!fs.existsSync(reviewedPath)) {
    throw new Error(
      `Reviewed localized security/IP article is missing from built blog output: ${reviewedPath}`,
    );
  }
}

assertHasMatch(
  textFiles,
  /\/(ar|de|es|fr|id|it|ja|ko|pl|pt|ru|th|tr|uk|vi|zh-CN|zh-TW)\/3-how-we-protect-your-work\//,
  "Reviewed localized security/IP article links are missing from built blog output.",
);

for (const locale of [
  "ar",
  "de",
  "es",
  "fr",
  "id",
  "it",
  "ja",
  "ko",
  "pl",
  "pt",
  "ru",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-CN",
]) {
  assertFileHasNoMatch(
    path.join(locale, "7-geometry-of-dramatic-parsing", "index.html"),
    /Zhang San|Li Si|張三：今天下雨|李四：真的嗎|角色：台詞/,
    `Detected non-localized Chinese/English example text on the ${locale} parsing article.`,
  );
}

assertFileHasMatch(
  path.join("fr", "7-geometry-of-dramatic-parsing", "index.html"),
  /ANNE : Il pleut aujourd/,
  "Missing localized French first dialogue example on the French parsing article.",
);

assertFileHasMatch(
  path.join("fr", "7-geometry-of-dramatic-parsing", "index.html"),
  /BENOIT : Vraiment/,
  "Missing localized French second dialogue example on the French parsing article.",
);

assertFileHasNoMatch(
  path.join("fr", "7-geometry-of-dramatic-parsing", "index.html"),
  /Ils regardent vers la fenêtre\.\)<\/strong>\)/,
  "Detected leftover punctuation from replaced French dialogue examples.",
);

console.log("Blog build contract check passed.");

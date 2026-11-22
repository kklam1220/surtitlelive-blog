import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { Marked } from "marked";
import sanitizeHtml from "sanitize-html";
import {
  insertReviewedArticleMedia,
  sanitizeLocalizedBlogHtml,
  serializeJsonLd,
} from "../src/lib/blogSecurity.mjs";

const require = createRequire(import.meta.url);
const {
  MARKDOWN_LINK_PARITY_SLUGS,
  findMarkdownDestinationParityIssues,
  findMarkdownImageParityIssues,
  normalizeMarkdownDestination,
} = require("./check-blog-localization.cjs");
const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(scriptsDirectory, "..");
const localizedRoot = path.join(blogRoot, "src", "content", "i18n", "blog");
const marked = new Marked();
const locales = fs
  .readdirSync(localizedRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

test("localized QLab demo only inserts the fixed reviewed media", () => {
  const marker = "<p>[[pockitle-station-qlab-demo]]</p>";
  const slug = "13-quick-qlab-subtitles-from-excel-txt";
  const html = insertReviewedArticleMedia(sanitizeLocalizedBlogHtml(marker), slug);
  assert.match(html, /<video controls/);
  assert.match(html, /https:\/\/surtitlelive\.com\/images\/qlab\/station-drag-to-qlab\.webm/);
  assert.equal(insertReviewedArticleMedia(marker, "unrelated-article"), marker);
  assert.doesNotMatch(sanitizeLocalizedBlogHtml('<video src="https://evil.example/a.webm" autoplay></video>'), /<video|evil\.example/);
  assert.doesNotMatch(insertReviewedArticleMedia(sanitizeLocalizedBlogHtml('<p>[[pockitle-station-qlab-demo]]<img src=x onerror=alert(1)></p>'), slug), /<video|onerror/);
});

test("Blog13 exposes the reviewed video and Station guidance in every locale", () => {
  const slug = "13-quick-qlab-subtitles-from-excel-txt";
  for (const locale of locales) {
    const payload = JSON.parse(fs.readFileSync(path.join(localizedRoot, locale, `${slug}.json`), "utf8"));
    assert.equal((payload.body.match(/\[\[pockitle-station-qlab-demo\]\]/g) || []).length, 1, locale);
    assert.match(payload.body, /Pockitle Cue Station/, locale);
    assert.match(payload.body, /https:\/\/surtitlelive\.com\/companion\/qlab/, locale);
    assert.doesNotMatch(payload.body, /```mermaid/, locale);
    const rendered = insertReviewedArticleMedia(sanitizeLocalizedBlogHtml(marked.parse(payload.body)), slug);
    assert.match(rendered, /<video controls/, locale);
    assert.doesNotMatch(rendered, /\[\[pockitle-station-qlab-demo\]\]/, locale);
  }
  const english = fs.readFileSync(path.join(blogRoot, "src", "content", "blog", `${slug}.md`), "utf8");
  assert.match(english, /station-drag-to-qlab\.webm/);
  assert.match(english, /station-drag-to-qlab\.mp4/);
});

test("built headers reject legacy and wrong-locale replacements of the published Live link", {
  skip: !fs.existsSync(path.join(blogRoot, "dist/index.html")),
}, () => {
  for (const [locale, wrong] of [["en", "https://surtitlelive.com/pockitle-live"], ["zh-TW", "https://pockitle.com/de/live"]]) {
    const index = path.join(blogRoot, "dist", locale === "en" ? "" : locale, "index.html");
    const original = fs.readFileSync(index, "utf8");
    const correct = `https://pockitle.com/${locale === "en" ? "" : `${locale}/`}live`;
    const header = original.match(/<header\b[\s\S]*?<\/header>/)?.[0];
    assert.ok(header?.includes(`href="${correct}"`), `${locale} published destination`);
    const changed = original.replace(header, header.replace(`href="${correct}"`, `href="${wrong}"`));
    assert.notEqual(changed, original, "negative fixture must change actual built output");
    try {
      fs.writeFileSync(index, changed);
      const check = spawnSync(process.execPath, [path.join(scriptsDirectory, "check-blog-build-contract.cjs")], { encoding: "utf8" });
      assert.notEqual(check.status, 0);
      assert.match(`${check.stdout}\n${check.stderr}`, /must preserve its published Live destination/);
    } finally { fs.writeFileSync(index, original); }
  }
});

test("Astro build image cache does not reuse private or no-store responses", async () => {
  const astroRoot = path.dirname(require.resolve("astro/package.json"));
  const { loadRemoteImage, revalidateRemoteImage } = await import(
    pathToFileURL(path.join(astroRoot, "dist/assets/build/remote.js")).href
  );
  const imageConfig = { domains: ["fixture.invalid"], remotePatterns: [] };
  for (const directive of ["private", "no-store"]) {
    const fetchFixture = async () => new Response("image fixture", {
      status: 200, headers: { "cache-control": `${directive}, max-age=600` },
    });
    const loaded = await loadRemoteImage("https://fixture.invalid/image.png", fetchFixture, imageConfig);
    assert.ok(loaded.expires <= Date.now(), `${directive} must have no usable build-cache TTL`);
    const revalidated = await revalidateRemoteImage(
      "https://fixture.invalid/image.png", {}, fetchFixture, imageConfig,
    );
    assert.ok(revalidated.expires <= Date.now(), `${directive} revalidation must not restore cache reuse`);
  }
});

test("standalone blog footer links to current Pockitle legal documents", () => {
  const footer = fs.readFileSync(path.join(blogRoot, "src", "components", "Footer.astro"), "utf8");
  for (const [policy, label] of [["terms", "Terms"], ["privacy", "Privacy"], ["viewer-agreement", "Viewer Agreement"]]) {
    assert.ok(footer.includes(`<a href="https://pockitle.com/${policy}">${label}</a>`));
  }
  assert.doesNotMatch(footer, /buildMainSiteHref\(['"]\/(?:terms|privacy|viewer-agreement)['"]\)/);
  assert.match(footer, /buildMainSiteHref\('\/contact'\)/);
  assert.doesNotMatch(footer, /from\s+['"][^'"]*config\//);
});

test("localization rejects source identity and known-issue structure drift before publication", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "blog-source-identity-"));
  const slug = "20-why-theatres-should-treat-mobile-surtitles-as-house-equipment";
  const copy = (relative) => {
    const target = path.join(fixture, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(blogRoot, relative), target);
    return target;
  };
  try {
    const configPath = copy("i18n/blog-localization.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    config.locales = ["id"];
    fs.writeFileSync(configPath, JSON.stringify(config));
    copy(`src/content/blog/${slug}.md`);
    copy("src/content/updates/en.json");
    const updatesPath = copy("src/content/updates/id.json");
    const updates = JSON.parse(fs.readFileSync(updatesPath, "utf8"));
    const payloadPath = copy(`src/content/i18n/blog/id/${slug}.json`);
    const original = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
    const check = () => spawnSync(process.execPath, [path.join(scriptsDirectory, "check-blog-localization.cjs")], {
      cwd: fixture, encoding: "utf8",
    });
    const valid = check();
    assert.equal(valid.status, 0, valid.stdout + valid.stderr);
    const drifted = structuredClone(updates);
    const releaseWithKnownIssues = drifted.weeks.flatMap((week) => week.versions).find((release) => release.knownIssues?.length);
    assert.ok(releaseWithKnownIssues, "fixture includes a release with known issues");
    releaseWithKnownIssues.knownIssues.pop();
    fs.writeFileSync(updatesPath, JSON.stringify(drifted));
    const invalidUpdates = check();
    assert.equal(invalidUpdates.status, 1);
    assert.match(invalidUpdates.stderr, /structure drifted from English/);
    fs.writeFileSync(updatesPath, JSON.stringify(updates));
    for (const change of [
      { slug: slug.replace("surtitles", "surtitel") },
      { locale: "fr" },
      { sourceLocale: "id" },
      { sourcePath: "src/content/blog/missing.md" },
    ]) {
      fs.writeFileSync(payloadPath, JSON.stringify({ ...original, ...change }));
      const invalid = check();
      assert.equal(invalid.status, 1);
      assert.match(invalid.stderr, /source identity must match/);
    }
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("reviewed serializer and browser sanitizer fixes cover every locked copy", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(blogRoot, "package.json"), "utf8"));
  const lock = JSON.parse(fs.readFileSync(path.join(blogRoot, "package-lock.json"), "utf8"));
  for (const [name, version] of Object.entries({ devalue: "5.9.4", dompurify: "3.4.17" })) {
    assert.equal(manifest.overrides?.[name], version, `${name} must preserve the reviewed security pin`);
    const copies = Object.entries(lock.packages).filter(([packagePath]) =>
      packagePath.endsWith(`node_modules/${name}`),
    );
    assert.ok(copies.length > 0, `${name} must remain in the actual dependency graph`);
    for (const [packagePath, node] of copies) {
      assert.equal(node.version, version, `${packagePath} must not retain a vulnerable copy`);
    }
  }
  assert.equal(manifest.dependencies["sanitize-html"], "2.18.1");
  assert.equal(manifest.overrides.vite, "8.1.6");
  assert.equal(manifest.overrides.postcss, "8.5.27");
  for (const [name, version] of Object.entries({ "sanitize-html": "2.18.1", vite: "8.1.6", postcss: "8.5.27" })) {
    const copies = Object.entries(lock.packages).filter(([packagePath]) =>
      packagePath.endsWith(`node_modules/${name}`),
    );
    assert.ok(copies.length > 0, `${name} must remain in the actual dependency graph`);
    for (const [packagePath, node] of copies) assert.equal(node.version, version, packagePath);
    assert.equal(require(`${name}/package.json`).version, version, `${name} installed artifact drift`);
  }
});

test("sanitizer keeps noscript discard intact across an implied ancestor close", () => {
  const html = '<p>Before</p><div><noscript></div><img src="https://discard.invalid/pixel"></noscript><p>After</p>';
  const sanitized = sanitizeHtml(html, {
    allowedTags: ["p", "div", "img"], allowedAttributes: { img: ["src"] },
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
  });
  assert.doesNotMatch(sanitized, /<img|discard\.invalid/);
  assert.match(sanitized, /<p>Before<\/p>/);
  assert.match(sanitized, /<p>After<\/p>/);
});

test("sanitizer rejects namespaced SMIL URL mutation and meta-refresh script schemes", () => {
  for (const tag of ["svg:animate", "xlink:set"]) {
    const sanitized = sanitizeHtml(`<svg><a href="#safe"><${tag} attributeName="href" values="#safe;javascript:probe()"/><text>Label</text></a></svg>`, {
      allowedTags: ["svg", "a", "text", tag],
      allowedAttributes: { a: ["href"], [tag]: ["attributeName", "values"] },
      allowedSchemes: ["https"],
    });
    assert.doesNotMatch(sanitized, /javascript:/i);
    assert.match(sanitized, /Label/);
  }
  for (const target of ["javascript:probe()", "data:text/html,probe"]) {
    const sanitized = sanitizeHtml(`<meta http-equiv="refresh" content="0;url=${target}"><p>Article</p>`, {
      allowedTags: ["meta", "p"], allowedAttributes: { meta: ["http-equiv", "content"] },
    });
    assert.doesNotMatch(sanitized, /javascript:|data:text\/html/i);
    assert.match(sanitized, /<p>Article<\/p>/);
    assert.doesNotMatch(sanitizeLocalizedBlogHtml(`<meta http-equiv="refresh" content="0;url=${target}">`), /<meta/i);
  }
});

test("RSS parser retains the stop-node CPU fix and compatible builder", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(blogRoot, "package.json"), "utf8"));
  const lock = JSON.parse(fs.readFileSync(path.join(blogRoot, "package-lock.json"), "utf8"));
  assert.equal(manifest.overrides["fast-xml-builder"], "1.3.1");
  const copies = Object.entries(lock.packages).filter(([name]) => name.endsWith("node_modules/fast-xml-parser"));
  assert.ok(copies.length > 0);
  for (const [name, entry] of copies) assert.equal(entry.version, "5.12.0", name);
  const { XMLParser, XMLBuilder } = require("fast-xml-parser");
  const rss = { rss: { channel: { title: "Pockitle" } } };
  assert.deepEqual(new XMLParser().parse(new XMLBuilder().build(rss)), rss);
  const probe = spawnSync(process.execPath, ["-e", [
    'const { XMLParser } = require("fast-xml-parser");',
    'try { new XMLParser({ stopNodes: ["stop"] }).parse("<stop>" + "<a ".repeat(100000)); } catch {}',
  ].join("\n")], { cwd: blogRoot, encoding: "utf8", timeout: 3000 });
  assert.equal(probe.status, 0, probe.error?.message || probe.stderr);
});

test("static Blog image caching does not use request-controlled stale reuse", () => {
  const config = fs.readFileSync(path.join(blogRoot, "astro.config.mjs"), "utf8");
  const lock = JSON.parse(fs.readFileSync(path.join(blogRoot, "package-lock.json"), "utf8"));
  const remoteHelper = fs.readFileSync(
    path.join(blogRoot, "node_modules", "astro", "dist", "assets", "build", "remote.js"),
    "utf8",
  );
  const assertTtlOnly = (source) => {
    assert.match(source, /from ["']http-cache-semantics["']/);
    assert.equal((source.match(/new CachePolicy\(/g) ?? []).length, 2);
    assert.equal(
      (source.match(/policy\.storable\(\)\s*\?\s*policy\.timeToLive\(\)\s*:\s*0/g) ?? []).length,
      2,
    );
    assert.doesNotMatch(
      source,
      /\.\s*(?:evaluateRequest|satisfiesWithoutRevalidation)\s*\(|\[\s*["'`](?:evaluateRequest|satisfiesWithoutRevalidation)["'`]\s*\]\s*\(/,
    );
  };

  assert.match(config, /output:\s*["']static["']/);
  assert.equal(fs.existsSync(path.join(blogRoot, "dist", "_worker.js")), false);
  assert.equal(fs.existsSync(path.join(blogRoot, "functions")), false);
  const packageManifest = lock.packages[""];
  for (const name of ["astro", "@astrojs/mdx"]) {
    assert.ok(packageManifest.devDependencies[name], name);
    assert.equal(packageManifest.dependencies[name], undefined, name);
    assert.equal(lock.packages[`node_modules/${name}`].dev, true, name);
  }
  assert.ok(packageManifest.dependencies.mermaid, "browser bundle remains audited");
  assert.equal(lock.packages["node_modules/astro"].version, "7.4.12");
  assertTtlOnly(remoteHelper);
  assert.equal(
    createHash("sha256").update(remoteHelper).digest("hex"),
    "d535748aadd2c4b7a53106cdd25f81743171e4f6862b622ce55cf1163fd946d7",
  );
  const ttlLine = "const expires = policy.storable() ? policy.timeToLive() : 0;";
  for (const method of ["evaluateRequest", "satisfiesWithoutRevalidation"]) {
    for (const call of [`policy.${method}(req);`, `policy["${method}"](req);`]) {
      const staleReuseMutant = remoteHelper.replace(ttlLine, `${call}\n  ${ttlLine}`);
      assert.notEqual(staleReuseMutant, remoteHelper);
      assert.throws(() => assertTtlOnly(staleReuseMutant));
    }
  }
});

test("provider HTML is inert while reviewed article structure is preserved", () => {
  const sanitized = sanitizeLocalizedBlogHtml([
    '<h2 id="safe">Heading</h2>',
    '<img src="https://surtitlelive.com/image.png" onerror="alert(1)">',
    '<a href="javascript:alert(2)">unsafe</a>',
    '<pre class="mermaid">graph TD; A--&gt;B</pre>',
    '<iframe src="https://www.youtube.com/embed/reviewed" title="Reviewed video"></iframe>',
    '<iframe src="https://evil.example/embed/phishing"></iframe>',
    '<script>globalThis.compromised = true</script>',
  ].join(""));

  assert.match(sanitized, /<h2 id="safe">Heading<\/h2>/);
  assert.match(sanitized, /<pre class="mermaid">/);
  assert.match(sanitized, /https:\/\/www\.youtube\.com\/embed\/reviewed/);
  assert.doesNotMatch(sanitized, /evil\.example/);
  assert.doesNotMatch(sanitized, /onerror|javascript:|<script/i);
});

test("JSON-LD cannot terminate its script element", () => {
  const serialized = serializeJsonLd({
    title: '</script><script>globalThis.compromised = true</script>',
    separator: "\u2028\u2029",
  });

  assert.doesNotMatch(serialized, /<|>|&|\u2028|\u2029/u);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u2028\\u2029/);
});

test("reviewed localized article links preserve canonical markdown destinations", () => {
  for (const slug of MARKDOWN_LINK_PARITY_SLUGS) {
    const sourcePath = path.join(blogRoot, "src", "content", "blog", `${slug}.md`);
    const source = fs.readFileSync(sourcePath, "utf8").replace(/^---[\s\S]*?---\n?/, "");
    for (const locale of locales) {
      const localizedPath = path.join(localizedRoot, locale, `${slug}.json`);
      const localized = JSON.parse(fs.readFileSync(localizedPath, "utf8"));
      const issues = findMarkdownDestinationParityIssues(
        { slug, body: source },
        localized,
        locales,
      );
      assert.deepEqual(issues, [], `${locale}/${slug} changed a canonical link destination`);
    }
  }
});

test("localized Blog21–25 emphasis renders without raw markdown markers", () => {
  const slugs = [
    "21-theatre-accessibility-captions-stage-directions",
    "22-one-night-different-stories-scripts-under-the-stars-calgary",
    "23-surtitlelive-becomes-pockitle-cue",
    "24-south-korea-surtitles-international-theatre-audiences",
    "25-pockitle-live-stenotype-input-plover",
  ];

  for (const slug of slugs) {
    for (const locale of locales) {
      const localizedPath = path.join(localizedRoot, locale, `${slug}.json`);
      const localized = JSON.parse(fs.readFileSync(localizedPath, "utf8"));
      const rendered = sanitizeLocalizedBlogHtml(marked.parse(localized.body));

      assert.match(rendered, /<strong>/, `${locale}/${slug} lost article emphasis`);
      assert.doesNotMatch(rendered, /\*\*/, `${locale}/${slug} exposes raw markdown emphasis`);
    }
  }
});

test("Blog24 keeps the chosen hero and places localized research artwork after the evidence", () => {
  const slug = "24-south-korea-surtitles-international-theatre-audiences";
  const source = fs.readFileSync(path.join(blogRoot, "src/content/blog", `${slug}.md`), "utf8");
  assert.match(source, /heroImage: "\.\/blog-24\.png"/);
  const sourcePost = { slug, body: source.replace(/^---[\s\S]*?---\n?/, "") };
  for (const asset of ["blog-24.png", "blog-24-language-access-infographic.png"]) {
    assert.ok(fs.existsSync(path.join(blogRoot, "src/content/blog", asset)));
  }
  for (const locale of locales) {
    const localized = JSON.parse(fs.readFileSync(path.join(localizedRoot, locale, `${slug}.json`), "utf8"));
    assert.equal(localized.frontmatter.heroImage, "./blog-24.png");
    assert.ok(localized.frontmatter.heroImageAlt.trim(), `${locale} needs hero alternative text`);
    assert.notEqual(localized.frontmatter.heroImageAlt, "Pockitle Cue multilingual subtitle screens beside seats in a theatre auditorium.");
    assert.deepEqual(findMarkdownImageParityIssues(sourcePost, localized), [], `${locale} changed the infographic`);
    const imagePosition = localized.body.indexOf("![");
    const secondHeading = [...localized.body.matchAll(/^## /gm)][1].index;
    assert.ok(imagePosition > localized.body.indexOf("ART002605795"), `${locale} must show the research first`);
    assert.ok(imagePosition < secondHeading, `${locale} must keep the infographic in the research section`);
    const rendered = sanitizeLocalizedBlogHtml(marked.parse(localized.body.slice(imagePosition, secondHeading)));
    assert.match(rendered, /<img[^>]+alt="[^"]+"/);
    assert.match(rendered, /<em>[^<]+<\/em>/, `${locale} needs a readable localized explanation`);
    const withoutImage = { ...localized, body: localized.body.replace(/!\[[^\]]*\]\([^\n)]+\)/, "") };
    assert.equal(findMarkdownImageParityIssues(sourcePost, withoutImage).length, 1, "missing artwork must fail parity");
  }
});

test("Blog24 affirmative accessibility FAQ links safely in every locale", () => {
  const slug = "24-south-korea-surtitles-international-theatre-audiences";
  const source = fs.readFileSync(path.join(blogRoot, "src/content/blog", `${slug}.md`), "utf8");
  assert.match(source, /\*The graphic brings together three different measures: accommodation arrivals in Italy, heritage preferences and stated attendance intentions in South Korea\.\*/);
  assert.doesNotMatch(source, /None measures additional ticket sales in European theatres\. Sources and qualifications are given above\./);
  for (const locale of ["en", ...locales]) {
    const geo = JSON.parse(fs.readFileSync(path.join(blogRoot, "src/content/i18n/geo", locale, `${slug}.json`), "utf8"));
    const item = geo.faq[2];
    const href = `https://surtitlelive.com/blog/${locale === "en" ? "" : `${locale}/`}21-theatre-accessibility-captions-stage-directions/`;
    if (locale === "en") {
      assert.equal(item.question, "Can Pockitle Cue support both multilingual surtitles and accessibility captions?");
      assert.match(item.answer, /^Yes\. Pockitle Cue supports translated dialogue, speaker identification and manually prepared Accessibility Captions for meaningful sounds\./);
    }
    assert.ok(item.answer.includes(`](${href})`), `${locale} needs the canonical Macbeth link`);
    const html = sanitizeLocalizedBlogHtml(marked.parseInline(item.answer, { async: false }));
    assert.ok(html.includes(`href="${href}"`), `${locale} must render a clickable link`);
    assert.doesNotMatch(html, /\]\(https?:/);
  }
  for (const relative of ["src/pages/[...slug].astro", "src/pages/[locale]/[slug].astro", "src/layouts/BlogPost.astro"]) {
    const renderer = fs.readFileSync(path.join(blogRoot, relative), "utf8");
    assert.ok(renderer.includes('item.answer.includes("](")'), `${relative} must preserve plain answers`);
    assert.ok(renderer.includes('sanitizeLocalizedBlogHtml(marked.parseInline(item.answer, { async: false }))'), `${relative} must sanitize link answers`);
  }
  const unsafe = '[bad](javascript:alert(1)) <img src="/fixture.png" onerror="alert(2)"> <script>globalThis.compromised = true</script>';
  const inert = sanitizeLocalizedBlogHtml(marked.parseInline(unsafe, { async: false }));
  assert.doesNotMatch(inert, /javascript:|onerror|<script|globalThis/i);
});

test("Blog25 preserves the supplied artwork and complete localized editorial blocks", () => {
  const slug = "25-pockitle-live-stenotype-input-plover";
  const { listSourcePosts } = require("./blog-i18n-utils.cjs");
  const post = listSourcePosts(path.join(blogRoot, "src/content/blog")).find((entry) => entry.slug === slug);
  assert.match(post.frontmatter.description, /\blive subtitles and captions\b/i);
  assert.match(post.body, /\blive subtitles and captions\b/i);
  assert.ok(post.frontmatter.tags.includes("Live Subtitles"));
  assert.equal(post.frontmatter.heroImage, "./blog-25.png");
  for (const [asset, hash] of [
    ["blog-25.png", "dce079659390b0df4ef4f59f6094781435f38d66ea4d79d8c4076f6d02bd223c"],
    ["blog-25-stenotype-by-line.png", "ec28d14f8a089092f3de1fa03b259d272fa8cb239261fe1f8b455be652ba301a"],
  ]) {
    assert.equal(createHash("sha256").update(fs.readFileSync(path.join(blogRoot, "src/content/blog", asset))).digest("hex"), hash);
  }
  for (const locale of ["en", ...locales]) {
    const payload = locale === "en" ? { body: post.body, frontmatter: post.frontmatter, sourceHash: post.sourceHash }
      : JSON.parse(fs.readFileSync(path.join(localizedRoot, locale, `${slug}.json`), "utf8"));
    assert.equal(payload.sourceHash, post.sourceHash, `${locale} source fingerprint`);
    assert.equal(payload.frontmatter.heroImage, "./blog-25.png");
    assert.ok(payload.frontmatter.heroImageAlt.trim());
    assert.equal([...payload.body.matchAll(/^## /gm)].length, 5, `${locale} must retain all five authored sections`);
    assert.deepEqual(findMarkdownImageParityIssues(post, payload), [], `${locale} must keep the body figure`);
    const imagePosition = payload.body.indexOf("![");
    const headings = [...payload.body.matchAll(/^## /gm)];
    assert.ok(imagePosition > headings[1].index && imagePosition < headings[2].index, `${locale} figure belongs with submission modes`);
    const html = sanitizeLocalizedBlogHtml(marked.parse(payload.body));
    assert.match(html, /<strong>/);
    assert.match(html, /href="mailto:info@pockitle\.com"/);
    assert.doesNotMatch(html, /\*\*|\[info@pockitle\.com\]/);
    const geo = JSON.parse(fs.readFileSync(path.join(blogRoot, "src/content/i18n/geo", locale, `${slug}.json`), "utf8"));
    assert.equal(geo.sourceHash, post.sourceHash);
    assert.equal(geo.keyTakeaways.length, 3);
    assert.equal(geo.faq.length, 4);
    assert.equal(geo.glossary.length, 3);
    assert.ok(geo.faq[3].answer.includes("[info@pockitle.com](mailto:info@pockitle.com)"));
    assert.deepEqual(geo.relatedLinks.map((link) => link.href), [
      `https://pockitle.com/${locale === "en" ? "" : `${locale}/`}live`,
      `https://surtitlelive.com/${locale === "en" ? "" : `${locale}/`}guides/pockitle-live-operations`,
    ]);
  }
  for (const relative of ["src/layouts/BlogPost.astro", "src/pages/index.astro", "src/pages/[locale]/index.astro"]) {
    assert.ok(fs.readFileSync(path.join(blogRoot, relative), "utf8").includes(slug), `${relative} must preserve the screenshot frame`);
  }
});

test("Blog26 preserves localized collaboration context and supplied diagrams", () => {
  const slug = "26-one-script-one-team-pockitle-cue-editor";
  const post = require("./blog-i18n-utils.cjs").listSourcePosts(path.join(blogRoot, "src/content/blog"))
    .find((entry) => entry.slug === slug);
  assert.match(post.body, /Real-time collaboration depends on an eligible plan/);
  assert.equal(post.frontmatter.heroImage, "./blog-26.png");
  for (const [asset, hash] of [
    ["blog-26.png", "d9622d5315990568c75cfe48ec7fe40b80f948ddbc4b4840cb8cdf4111dab7df"],
    ["blog-26-team-handoff.png", "d4e029ca2ccfd42236781ee96a3759912b64a061f70e30208ec8e5f9e83826f6"],
    ["blog-26-concurrent-edit.png", "8dc3a4bee467338f9caea31f403236708bd8d31dcd0826c117717b4b0dc6e6af"],
    ["blog-26-translation-approval.png", "3577a5bc44100407d76cd487cc827a942fddde41c0eebd867ed33f7cbe442557"],
    ["blog-26-collaboration-connected.png", "0986bf3ff5bed97f8392edd78bb15b8069e7b52786643a2ec65ba7447f911e58"],
    ["blog-26-editor-actions.png", "201bacf0e93369da144e1a7b7b13409b34ae031345c38390e8c187c6bd759a3e"],
    ["blog-26-line-discussion.png", "8c682c3b0914aaa0dbd72b3b4bbc5944ed37f8f27a35a793d8b738c34e08545b"],
  ]) assert.equal(createHash("sha256").update(fs.readFileSync(path.join(blogRoot, "src/content/blog", asset))).digest("hex"), hash);
  for (const locale of ["en", ...locales]) {
    const payload = locale === "en" ? { body: post.body, frontmatter: post.frontmatter, sourceHash: post.sourceHash }
      : JSON.parse(fs.readFileSync(path.join(localizedRoot, locale, `${slug}.json`), "utf8"));
    assert.equal(payload.sourceHash, post.sourceHash, locale);
    assert.equal(payload.frontmatter.heroImage, post.frontmatter.heroImage);
    assert.ok(payload.frontmatter.heroImageAlt.trim());
    assert.equal([...payload.body.matchAll(/^## /gm)].length, 8, locale);
    assert.deepEqual(findMarkdownImageParityIssues(post, payload), [], locale);
    assert.deepEqual(findMarkdownDestinationParityIssues(post, payload, locales), [], locale);
    assert.equal([...payload.body.matchAll(/!\[([^\]]+)\]\(/g)].length, 6, locale);
    assert.match(payload.body, /\| --- \| --- \|/, locale);
    const html = sanitizeLocalizedBlogHtml(marked.parse(payload.body));
    assert.doesNotMatch(html, /\*\*/);
    assert.match(html, /<strong>/);
    for (const name of ['add', 'merge', 'flag', 'lock', 'delete', 'minus', 'check', 'review', 'memo', 'history', 'ai']) {
      assert.match(html, new RegExp(`editor-action-${name}`), `${locale}: missing ${name} icon`);
    }
    const geo = JSON.parse(fs.readFileSync(path.join(blogRoot, "src/content/i18n/geo", locale, `${slug}.json`), "utf8"));
    assert.equal(geo.sourceHash, post.sourceHash, locale);
    assert.equal(geo.keyTakeaways.length, 3, locale);
    assert.equal(geo.faq.length, 4, locale);
    assert.equal(geo.glossary.length, 5, locale);
    assert.deepEqual(geo.relatedLinks.map(item => item.href), ["https://surtitlelive.com/", "https://surtitlelive.com/guides/open-editor"]);
  }
  const iconCss = fs.readFileSync(path.join(blogRoot, 'src/styles/global.css'), 'utf8');
  assert.match(iconCss, /table:has\(\.editor-action-icon\)/);
  assert.match(iconCss, /@media \(max-width: 480px\)/);
  for (const relative of ["src/layouts/BlogPost.astro", "src/pages/index.astro", "src/pages/[locale]/index.astro"]) {
    assert.ok(fs.readFileSync(path.join(blogRoot, relative), "utf8").includes(slug), relative);
  }
});

test("canonical-link parity permits a supported locale route prefix", () => {
  assert.equal(
    normalizeMarkdownDestination("/es/mobile-theatre-subtitles", locales),
    "/mobile-theatre-subtitles",
  );
  assert.equal(
    normalizeMarkdownDestination(
      "https://surtitlelive.com/zh-TW/planning/theatre-captions-vs-surtitles",
      locales,
    ),
    "https://surtitlelive.com/planning/theatre-captions-vs-surtitles",
  );
});

test("canonical-link parity rejects locale-before-blog redirect chains", () => {
  const issues = findMarkdownDestinationParityIssues(
    {
      slug: "7-geometry-of-dramatic-parsing",
      body: "[Article](/blog/8-from-layout-to-archetype-detection/)",
    },
    { body: "[Article](/id/blog/8-from-layout-to-archetype-detection/)" },
    locales,
  );

  assert.equal(issues.length, 1);
  assert.equal(issues[0].actual, "/id/blog/8-from-layout-to-archetype-detection/");
});

test("canonical-link parity rejects translated route slugs", () => {
  const issues = findMarkdownDestinationParityIssues(
    {
      slug: "8-from-layout-to-archetype-detection",
      body: "[Article](https://surtitlelive.com/ai-script-to-theatre-subtitles)",
    },
    {
      body: "[Article](https://surtitlelive.com/ai-script-to-theatre-legendas)",
    },
    locales,
  );

  assert.equal(issues.length, 1);
  assert.equal(
    issues[0].actual,
    "https://surtitlelive.com/ai-script-to-theatre-legendas",
  );
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";
import {
  sanitizeLocalizedBlogHtml,
  serializeJsonLd,
} from "../src/lib/blogSecurity.mjs";

const require = createRequire(import.meta.url);
const {
  MARKDOWN_LINK_PARITY_SLUGS,
  findMarkdownDestinationParityIssues,
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

test("Macbeth accessibility-caption translations render emphasis without raw markdown markers", () => {
  const slug = "21-theatre-accessibility-captions-stage-directions";

  for (const locale of locales) {
    const localizedPath = path.join(localizedRoot, locale, `${slug}.json`);
    const localized = JSON.parse(fs.readFileSync(localizedPath, "utf8"));
    const rendered = sanitizeLocalizedBlogHtml(marked.parse(localized.body));

    assert.match(rendered, /<strong>/, `${locale}/${slug} lost article emphasis`);
    assert.doesNotMatch(rendered, /\*\*/, `${locale}/${slug} exposes raw markdown emphasis`);
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

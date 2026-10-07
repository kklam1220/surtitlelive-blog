import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
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

test("localization rejects wrong slugs, locales and source paths before publication", () => {
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
    copy("src/content/updates/en.json"); copy("src/content/updates/id.json");
    const payloadPath = copy(`src/content/i18n/blog/id/${slug}.json`);
    const original = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
    const check = () => spawnSync(process.execPath, [path.join(scriptsDirectory, "check-blog-localization.cjs")], { cwd: fixture, encoding: "utf8" });
    const valid = check();
    assert.equal(valid.status, 0, valid.stdout + valid.stderr);
    for (const change of [{ slug: slug.replace("surtitles", "surtitel") }, { locale: "fr" }, { sourceLocale: "id" }, { sourcePath: "src/content/blog/missing.md" }]) {
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
  for (const [name, version] of Object.entries({ devalue: "5.9.3", dompurify: "3.4.16" })) {
    assert.equal(manifest.overrides?.[name], version, `${name} must preserve the reviewed security pin`);
    const copies = Object.entries(lock.packages).filter(([packagePath]) =>
      packagePath.endsWith(`node_modules/${name}`),
    );
    assert.ok(copies.length > 0, `${name} must remain in the actual dependency graph`);
    for (const [packagePath, node] of copies) {
      assert.equal(node.version, version, `${packagePath} must not retain a vulnerable copy`);
    }
  }
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
  assert.equal(lock.packages["node_modules/astro"].version, "7.3.2");
  assertTtlOnly(remoteHelper);
  assert.equal(
    createHash("sha256").update(remoteHelper).digest("hex"),
    "f373fa76e3112446db327c79b34e2bbb1ef1dcad41affb60788adf30edc9588e",
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

test("localized Blog21, Blog22, and Blog23 emphasis renders without raw markdown markers", () => {
  const slugs = [
    "21-theatre-accessibility-captions-stage-directions",
    "22-one-night-different-stories-scripts-under-the-stars-calgary",
    "23-surtitlelive-becomes-pockitle-cue",
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

#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const distDir = path.resolve(__dirname, "..", "dist");
const FRINGE_SUPPORT_SLUG = "14-fringe-theatre-accessibility-captions-surtitles-support-2026";
const PUBLIC_EMAIL_LOCALES = [
  "",
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
];
const PUBLIC_EMAIL_OUTPUT_PATHS = PUBLIC_EMAIL_LOCALES.map((locale) =>
  path.join(...[locale, FRINGE_SUPPORT_SLUG, "index.html"].filter(Boolean)),
);
const SAFE_PUBLIC_EMAIL_HTML = [
  '<span class="stl-public-email"',
  ' data-stl-email-local="info"',
  ' data-stl-email-domain-parts="surtitlelive,com">',
  "info [at] surtitlelive [dot] com</span>",
].join("");
const UNSAFE_PUBLIC_EMAIL_LINK = '<a href="mailto:info@surtitlelive.com">info@surtitlelive.com</a>';

function countOccurrences(source, value) {
  return source.split(value).length - 1;
}

function rewritePublicEmailDocument(source, relativePath) {
  const replacements = countOccurrences(source, UNSAFE_PUBLIC_EMAIL_LINK);
  if (replacements !== 2) {
    throw new Error(
      `Expected exactly two public email links in ${relativePath}; found ${replacements}.`,
    );
  }

  const unexpectedEmailSource = source.split(UNSAFE_PUBLIC_EMAIL_LINK).join("");
  if (/info@surtitlelive\.com/i.test(unexpectedEmailSource)) {
    throw new Error(`Found a public email outside the reviewed article links in ${relativePath}.`);
  }

  const rewritten = source.split(UNSAFE_PUBLIC_EMAIL_LINK).join(SAFE_PUBLIC_EMAIL_HTML);
  if (/info@surtitlelive\.com|mailto:info@surtitlelive\.com/i.test(rewritten)) {
    throw new Error(`Failed to remove the complete public email from ${relativePath}.`);
  }

  return { replacements, rewritten };
}

function rewritePublicEmailLinks() {
  if (!fs.existsSync(distDir)) {
    throw new Error("Blog dist/ does not exist. Run the Astro build first.");
  }

  let rewrittenFiles = 0;
  let rewrittenAddresses = 0;

  for (const relativePath of PUBLIC_EMAIL_OUTPUT_PATHS) {
    const filePath = path.join(distDir, relativePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing expected Fringe Support output: ${relativePath}`);
    }

    const source = fs.readFileSync(filePath, "utf8");
    const { replacements, rewritten } = rewritePublicEmailDocument(source, relativePath);

    fs.writeFileSync(filePath, rewritten);
    rewrittenFiles += 1;
    rewrittenAddresses += replacements;
  }

  console.log(
    `[blog:email-links] rewrittenFiles=${rewrittenFiles} rewrittenAddresses=${rewrittenAddresses}`,
  );
}

if (require.main === module) {
  rewritePublicEmailLinks();
}

module.exports = {
  PUBLIC_EMAIL_OUTPUT_PATHS,
  SAFE_PUBLIC_EMAIL_HTML,
  rewritePublicEmailDocument,
  rewritePublicEmailLinks,
};

#!/usr/bin/env node

const path = require("node:path");
const {
  ROOT,
  loadConfig,
  readJson,
  parseArgs,
  pickLocales,
  pickPosts,
  listSourcePosts,
} = require("./blog-i18n-utils.cjs");

function isMostlyEnglishCopy(sourcePost, localizedPayload) {
  const sourceTitle = sourcePost.frontmatter?.title || "";
  const sourceDescription = sourcePost.frontmatter?.description || "";
  const sourceBody = sourcePost.body || "";
  const targetTitle = localizedPayload.frontmatter?.title || "";
  const targetDescription = localizedPayload.frontmatter?.description || "";
  const targetBody = localizedPayload.body || "";

  return (
    targetTitle.trim() === sourceTitle.trim() &&
    targetDescription.trim() === sourceDescription.trim() &&
    targetBody.trim() === sourceBody.trim()
  );
}

function hasInvalidBodyMarkup(localizedPayload) {
  const body = localizedPayload.body || "";
  return (
    /^\s*```(?:markdown|md)\s*\r?\n/i.test(body) ||
    /<script\s+type=["']application\/ld\+json["']/i.test(body) ||
    /^\s*import\s+[A-Za-z_$][\w$]*\s+from\s+["']\.\/[^"']+\.(?:avif|gif|jpe?g|png|webp)["'];?/im.test(body) ||
    /src=\{[A-Za-z_$][\w$]*\.src\}/.test(body)
  );
}

function hasInvalidQlabCompanionSemantics(post, localizedPayload) {
  if (post.slug !== "13-quick-qlab-subtitles-from-excel-txt") {
    return false;
  }

  const body = localizedPayload.body || "";
  const requiredLiteralCueNames = [
    "CLEAR PREVIOUS",
    "CLEAR LAST SUBTITLE",
  ];
  return (
    requiredLiteralCueNames.some((cueName) => !body.includes(cueName)) ||
    !/\bDISPLAY\s+[A-Za-z][A-Za-z-]*\b/.test(body)
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const sourceDir = path.join(ROOT, config.sourceDir);
  const localizedRoot = path.join(ROOT, config.localizedDir);
  const locales = pickLocales(config.locales, args.locales);
  const posts = pickPosts(listSourcePosts(sourceDir), args.slugs);
  const deferredSlugs = new Set(
    Array.isArray(config.deferredLocalizedSlugs) ? config.deferredLocalizedSlugs : [],
  );

  let hasError = false;

  for (const locale of locales) {
    let missing = 0;
    let stale = 0;
    let englishCopy = 0;
    let invalid = 0;
    let invalidBodyMarkup = 0;
    let invalidQlabSemantics = 0;
    let deferred = 0;

    for (const post of posts) {
      const localePath = path.join(localizedRoot, locale, `${post.slug}.json`);
      let payload;
      try {
        payload = readJson(localePath);
      } catch {
        missing += 1;
        hasError = true;
        continue;
      }

      if (deferredSlugs.has(post.slug) && payload.status !== "translated") {
        deferred += 1;
        continue;
      }
      if (payload.sourceHash !== post.sourceHash) {
        stale += 1;
        hasError = true;
      }
      if (payload.status !== "translated") {
        invalid += 1;
        hasError = true;
      }
      if (isMostlyEnglishCopy(post, payload)) {
        englishCopy += 1;
        hasError = true;
      }
      if (hasInvalidBodyMarkup(payload)) {
        invalidBodyMarkup += 1;
        hasError = true;
      }
      if (hasInvalidQlabCompanionSemantics(post, payload)) {
        invalidQlabSemantics += 1;
        hasError = true;
      }
    }

    console.log(
      `[blog:i18n:check] [${locale}] missing=${missing} stale=${stale} englishCopy=${englishCopy} invalidStatus=${invalid} invalidBodyMarkup=${invalidBodyMarkup} invalidQlabSemantics=${invalidQlabSemantics} deferred=${deferred}`,
    );
  }

  if (hasError) {
    console.error(
      "[blog:i18n:check] Failed. Run `npm run blog:i18n:sync` then `npm run blog:i18n:translate:llm -- --force`.",
    );
    process.exit(1);
  }
  console.log("[blog:i18n:check] Passed.");
}

main();

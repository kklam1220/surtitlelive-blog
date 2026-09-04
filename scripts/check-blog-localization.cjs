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
    /^\s*import\s+[A-Za-z_$][\w$]*\s+from\s+["']\.\/[^"']+\.(?:avif|gif|jpe?g|png|webp)["'];?/im.test(
      body,
    ) ||
    /src=\{[A-Za-z_$][\w$]*\.src\}/.test(body)
  );
}

function hasInvalidQlabCompanionSemantics(post, localizedPayload) {
  if (post.slug !== "13-quick-qlab-subtitles-from-excel-txt") {
    return false;
  }

  const body = localizedPayload.body || "";
  const requiredLiteralCueNames = ["CLEAR PREVIOUS", "CLEAR LAST SUBTITLE"];
  return (
    requiredLiteralCueNames.some((cueName) => !body.includes(cueName)) ||
    !/\bDISPLAY\s+[A-Za-z][A-Za-z-]*\b/.test(body)
  );
}

function proseWithoutTechnicalLiterals(markdown) {
  return String(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`\n]+`/g, " ")
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
}

function findEnglishProseResidue(localizedPayload, forbiddenTerms) {
  const prose = proseWithoutTechnicalLiterals(
    [
      localizedPayload.frontmatter?.title,
      localizedPayload.frontmatter?.description,
      localizedPayload.body,
    ].join("\n"),
  );

  return forbiddenTerms.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`, "i").test(prose);
  });
}

function collectStringValues(value, strings = [], key = "") {
  if (["generatedAt", "locale", "slug", "sourceHash"].includes(key)) {
    return strings;
  }
  if (typeof value === "string") {
    strings.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStringValues(item, strings, key));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([childKey, item]) =>
      collectStringValues(item, strings, childKey),
    );
  }
  return strings;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const sourceDir = path.join(ROOT, config.sourceDir);
  const localizedRoot = path.join(ROOT, config.localizedDir);
  const localizedGeoRoot = path.join(
    ROOT,
    config.localizedGeoDir || "src/content/i18n/geo",
  );
  const locales = pickLocales(config.locales, args.locales);
  const posts = pickPosts(listSourcePosts(sourceDir), args.slugs);
  const deferredSlugs = new Set(
    Array.isArray(config.deferredLocalizedSlugs)
      ? config.deferredLocalizedSlugs
      : [],
  );
  const forbiddenEnglishProseTerms = Array.isArray(
    config.forbiddenEnglishProseTerms,
  )
    ? config.forbiddenEnglishProseTerms
    : [];

  let hasError = false;

  for (const locale of locales) {
    let missing = 0;
    let stale = 0;
    let englishCopy = 0;
    let invalid = 0;
    let invalidBodyMarkup = 0;
    let invalidQlabSemantics = 0;
    let englishProseResidue = 0;
    let geoEnglishProseResidue = 0;
    let deferred = 0;

    for (const post of posts) {
      const localePath = path.join(localizedRoot, locale, `${post.slug}.json`);
      const isDeferred = deferredSlugs.has(post.slug);
      let payload;
      try {
        payload = readJson(localePath);
      } catch {
        if (isDeferred) {
          deferred += 1;
          continue;
        }
        missing += 1;
        hasError = true;
        continue;
      }

      if (isDeferred && payload.status !== "translated") {
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
      const residue = findEnglishProseResidue(
        payload,
        forbiddenEnglishProseTerms,
      );
      if (residue.length > 0) {
        englishProseResidue += residue.length;
        hasError = true;
        console.error(
          `[blog:i18n:check] [${locale}] ${post.slug}: untranslated prose terms: ${residue.join(", ")}`,
        );
      }

      const geoPath = path.join(localizedGeoRoot, locale, `${post.slug}.json`);
      try {
        const geoPayload = readJson(geoPath);
        const geoResidue = findEnglishProseResidue(
          { body: collectStringValues(geoPayload).join("\n") },
          forbiddenEnglishProseTerms,
        );
        if (geoResidue.length > 0) {
          geoEnglishProseResidue += geoResidue.length;
          hasError = true;
          console.error(
            `[blog:i18n:check] [${locale}] ${post.slug} GEO: untranslated prose terms: ${geoResidue.join(", ")}`,
          );
        }
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    }

    console.log(
      `[blog:i18n:check] [${locale}] missing=${missing} stale=${stale} englishCopy=${englishCopy} englishProseResidue=${englishProseResidue} geoEnglishProseResidue=${geoEnglishProseResidue} invalidStatus=${invalid} invalidBodyMarkup=${invalidBodyMarkup} invalidQlabSemantics=${invalidQlabSemantics} deferred=${deferred}`,
    );
  }

  if (hasError) {
    console.error(
      "[blog:i18n:check] Failed. Review each locale against the approved product terminology and refresh stale source hashes before publishing.",
    );
    process.exit(1);
  }
  console.log("[blog:i18n:check] Passed.");
}

main();

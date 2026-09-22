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

const MARKDOWN_LINK_PARITY_SLUGS = new Set([
  "7-geometry-of-dramatic-parsing",
  "8-from-layout-to-archetype-detection",
  "9-english-surtitles-non-english-show-fringe",
  "10-non-english-fringe-shows-original-voice",
  "11-captions-vs-surtitles-edinburgh-fringe",
  "14-fringe-theatre-accessibility-captions-surtitles-support-2026",
  "13-quick-qlab-subtitles-from-excel-txt",
  "17-surtitlelive-launches-pockitle-live-captioning",
  "20-why-theatres-should-treat-mobile-surtitles-as-house-equipment",
]);

const MARKDOWN_LINK_PARITY_PREFIX_COUNTS = new Map([
  ["13-quick-qlab-subtitles-from-excel-txt", 3],
  ["20-why-theatres-should-treat-mobile-surtitles-as-house-equipment", 1],
]);

const MARKDOWN_IMAGE_PARITY_SLUGS = new Set([
  "20-why-theatres-should-treat-mobile-surtitles-as-house-equipment",
]);

const MARKDOWN_IMAGE_PARITY_COUNTS = new Map([
  ["20-why-theatres-should-treat-mobile-surtitles-as-house-equipment", 2],
]);

function extractMarkdownDestinations(markdown) {
  const destinations = [];
  const linkPattern = /(?<!!)(?:\[[^\]]*\])\(([^)\n]+)\)/g;
  let match;
  while ((match = linkPattern.exec(markdown || ""))) {
    destinations.push(
      match[1]
        .trim()
        .replace(/\s+["'][^"']*["']\s*$/, "")
        .trim(),
    );
  }
  return destinations;
}

function extractMarkdownImageDestinations(markdown) {
  const destinations = [];
  const imagePattern = /!\[[^\]]*\]\(([^)\n]+)\)/g;
  let match;
  while ((match = imagePattern.exec(markdown || ""))) {
    destinations.push(match[1].trim());
  }
  return destinations;
}

function normalizeMarkdownDestination(destination, locales) {
  for (const locale of ["en", ...locales]) {
    const relativePrefix = `/${locale}/`;
    const malformedRelativeBlogPrefix = `/${locale}/blog/`;
    const canonicalRelativeBlogPrefix = `/blog/${locale}/`;
    const malformedAbsoluteBlogPrefix = `https://surtitlelive.com${malformedRelativeBlogPrefix}`;
    const canonicalAbsoluteBlogPrefix = `https://surtitlelive.com${canonicalRelativeBlogPrefix}`;

    if (
      destination.startsWith(malformedRelativeBlogPrefix) ||
      destination.startsWith(malformedAbsoluteBlogPrefix)
    ) {
      return destination;
    }
    if (destination.startsWith(canonicalRelativeBlogPrefix)) {
      return `/blog/${destination.slice(canonicalRelativeBlogPrefix.length)}`;
    }
    if (destination.startsWith(canonicalAbsoluteBlogPrefix)) {
      return `https://surtitlelive.com/blog/${destination.slice(canonicalAbsoluteBlogPrefix.length)}`;
    }

    if (destination.startsWith(relativePrefix)) {
      return `/${destination.slice(relativePrefix.length)}`;
    }

    const absolutePrefix = `https://surtitlelive.com${relativePrefix}`;
    if (destination.startsWith(absolutePrefix)) {
      return `https://surtitlelive.com/${destination.slice(absolutePrefix.length)}`;
    }
  }
  return destination;
}

function findMarkdownDestinationParityIssues(sourcePost, localizedPayload, locales) {
  if (!MARKDOWN_LINK_PARITY_SLUGS.has(sourcePost.slug)) {
    return [];
  }

  const expected = extractMarkdownDestinations(sourcePost.body).map((destination) =>
    normalizeMarkdownDestination(destination, locales),
  );
  const actual = extractMarkdownDestinations(localizedPayload.body).map((destination) =>
    normalizeMarkdownDestination(destination, locales),
  );
  const issues = [];
  const count =
    MARKDOWN_LINK_PARITY_PREFIX_COUNTS.get(sourcePost.slug) ??
    Math.max(expected.length, actual.length);

  for (let index = 0; index < count; index += 1) {
    if (expected[index] !== actual[index]) {
      issues.push({
        index,
        expected: expected[index] || "<missing>",
        actual: actual[index] || "<missing>",
      });
    }
  }

  return issues;
}

function findMarkdownImageParityIssues(sourcePost, localizedPayload) {
  if (!MARKDOWN_IMAGE_PARITY_SLUGS.has(sourcePost.slug)) {
    return [];
  }

  const expected = extractMarkdownImageDestinations(sourcePost.body);
  const actual = extractMarkdownImageDestinations(localizedPayload.body);
  const count =
    MARKDOWN_IMAGE_PARITY_COUNTS.get(sourcePost.slug) ??
    Math.max(expected.length, actual.length);
  const issues = [];

  for (let index = 0; index < count; index += 1) {
    if (expected[index] !== actual[index]) {
      issues.push({
        index,
        expected: expected[index] || "<missing>",
        actual: actual[index] || "<missing>",
      });
    }
  }

  return issues;
}

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

function validateProductUpdates(config) {
  const updatesRoot = path.join(ROOT, "src", "content", "updates");
  const expectedLocales = ["en", ...config.locales].sort();
  const actualLocales = require("node:fs")
    .readdirSync(updatesRoot)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.basename(name, ".json"))
    .sort();
  const errors = [];
  const forbiddenProviderTerms = [
    "anthropic",
    "assemblyai",
    "azure ai",
    "deepseek",
    "gemini",
    "google ai",
    "openai",
    "soniox",
    "whisper",
  ];
  const forbiddenInternalAudienceTerms = [
    "admin console",
    "admin tools",
    "billing reconciliation",
    "credit allocation",
    "credit entitlement",
    "credit quantity",
    "internal security",
    "pro access pass",
    "pro+ access pass",
    "release-validation",
    "rollback",
    "security hardening",
    "staging deployment",
    "super admin",
    "usage settlement",
  ];

  if (actualLocales.join(",") !== expectedLocales.join(",")) {
    errors.push(`locale files expected ${expectedLocales.join(",")} but found ${actualLocales.join(",")}`);
  }

  const english = readJson(path.join(updatesRoot, "en.json"));
  const releaseShape = (payload) => payload.weeks.map((week) => ({
    startDate: week.startDate,
    endDate: week.endDate,
    versions: week.versions.map((release) => ({
      version: release.version,
      releaseDate: release.releaseDate,
    })),
  }));
  const expectedShape = JSON.stringify(releaseShape(english));
  const seenVersions = new Set();
  let previousStartDate = null;

  for (const week of english.weeks) {
    const startDate = new Date(`${week.startDate}T00:00:00Z`);
    const endDate = new Date(`${week.endDate}T00:00:00Z`);
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setUTCDate(expectedEndDate.getUTCDate() + 6);
    if (startDate.getUTCDay() !== 0) {
      errors.push(`en: week ${week.startDate} must start on Sunday`);
    }
    if (endDate.getUTCDay() !== 6 || endDate.getTime() !== expectedEndDate.getTime()) {
      errors.push(`en: week ${week.startDate} must end on the following Saturday`);
    }
    if (previousStartDate && startDate >= previousStartDate) {
      errors.push(`en: weeks must be ordered newest first`);
    }
    previousStartDate = startDate;
    for (const release of week.versions) {
      const releaseDate = new Date(`${release.releaseDate}T00:00:00Z`);
      if (releaseDate < startDate || releaseDate > endDate) {
        errors.push(`en: ${release.version} releaseDate is outside its week`);
      }
      if (!/^v\d{6}\.\d{2}$/.test(release.version)) {
        errors.push(`en: invalid Cloud release version ${release.version}`);
      }
      if (seenVersions.has(release.version)) {
        errors.push(`en: duplicate Cloud release version ${release.version}`);
      }
      seenVersions.add(release.version);
      if ([release.new, release.improved, release.fixed].every((items) => items.length === 0)) {
        errors.push(`en: ${release.version} has no public release notes`);
      }
    }
  }

  for (const locale of actualLocales) {
    const payload = readJson(path.join(updatesRoot, `${locale}.json`));
    if (payload.locale !== locale) {
      errors.push(`${locale}: payload locale is ${payload.locale || "<missing>"}`);
    }
    if (JSON.stringify(releaseShape(payload)) !== expectedShape) {
      errors.push(`${locale}: week/version/date structure drifted from English`);
    }
    if (locale !== "en" && payload.title === english.title) {
      errors.push(`${locale}: visible Product Updates copy still matches English`);
    }
    const prose = collectStringValues(payload).join("\n").toLocaleLowerCase("en");
    const matchedProviders = forbiddenProviderTerms.filter((term) => prose.includes(term));
    if (matchedProviders.length > 0) {
      errors.push(`${locale}: forbidden provider/model names: ${matchedProviders.join(", ")}`);
    }
    const matchedInternalAudienceTerms = forbiddenInternalAudienceTerms.filter((term) => prose.includes(term));
    if (matchedInternalAudienceTerms.length > 0) {
      errors.push(`${locale}: forbidden internal-admin copy: ${matchedInternalAudienceTerms.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    errors.forEach((error) => console.error(`[blog:i18n:check] [updates] ${error}`));
    return false;
  }
  console.log(`[blog:i18n:check] [updates] locales=${actualLocales.length} structure=aligned providerNames=0`);
  return true;
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
  const blogTermResidueRules =
    config.blogTermResidueRules && typeof config.blogTermResidueRules === "object"
      ? config.blogTermResidueRules
      : {};

  let hasError = false;

  if (!validateProductUpdates(config)) {
    hasError = true;
  }

  for (const locale of locales) {
    let missing = 0;
    let stale = 0;
    let englishCopy = 0;
    let invalid = 0;
    let invalidBodyMarkup = 0;
    let invalidQlabSemantics = 0;
    let markdownLinkParity = 0;
    let markdownImageParity = 0;
    let englishProseResidue = 0;
    let geoEnglishProseResidue = 0;
    let blogTermResidue = 0;
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
      const linkIssues = findMarkdownDestinationParityIssues(
        post,
        payload,
        config.locales,
      );
      if (linkIssues.length > 0) {
        markdownLinkParity += linkIssues.length;
        hasError = true;
        console.error(
          `[blog:i18n:check] [${locale}] ${post.slug}: markdown destination parity: ${linkIssues
            .map(
              ({ index, expected, actual }) =>
                `#${index} expected ${expected} but found ${actual}`,
            )
            .join(", ")}`,
        );
      }
      const imageIssues = findMarkdownImageParityIssues(post, payload);
      if (imageIssues.length > 0) {
        markdownImageParity += imageIssues.length;
        hasError = true;
        console.error(
          `[blog:i18n:check] [${locale}] ${post.slug}: markdown image parity: ${imageIssues
            .map(
              ({ index, expected, actual }) =>
                `#${index} expected ${expected} but found ${actual}`,
            )
            .join(", ")}`,
        );
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

      const blogTerms = Array.isArray(blogTermResidueRules[post.slug])
        ? blogTermResidueRules[post.slug]
        : [];
      const blogResidue = findEnglishProseResidue(payload, blogTerms);
      if (blogResidue.length > 0) {
        blogTermResidue += blogResidue.length;
        hasError = true;
        console.error(
          `[blog:i18n:check] [${locale}] ${post.slug}: locale-specific terminology residue: ${blogResidue.join(", ")}`,
        );
      }

      const geoPath = path.join(localizedGeoRoot, locale, `${post.slug}.json`);
      try {
        const geoPayload = readJson(geoPath);
        if (geoPayload.slug !== post.slug) {
          hasError = true;
          console.error(
            `[blog:i18n:check] [${locale}] ${post.slug} GEO: slug must match the canonical post slug`,
          );
        }
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
        const geoBlogResidue = findEnglishProseResidue(
          { body: collectStringValues(geoPayload).join("\n") },
          blogTerms,
        );
        if (geoBlogResidue.length > 0) {
          blogTermResidue += geoBlogResidue.length;
          hasError = true;
          console.error(
            `[blog:i18n:check] [${locale}] ${post.slug} GEO: locale-specific terminology residue: ${geoBlogResidue.join(", ")}`,
          );
        }
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    }

    console.log(
      `[blog:i18n:check] [${locale}] missing=${missing} stale=${stale} englishCopy=${englishCopy} englishProseResidue=${englishProseResidue} geoEnglishProseResidue=${geoEnglishProseResidue} blogTermResidue=${blogTermResidue} invalidStatus=${invalid} invalidBodyMarkup=${invalidBodyMarkup} invalidQlabSemantics=${invalidQlabSemantics} markdownLinkParity=${markdownLinkParity} markdownImageParity=${markdownImageParity} deferred=${deferred}`,
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

if (require.main === module) {
  main();
}

module.exports = {
  MARKDOWN_LINK_PARITY_SLUGS,
  extractMarkdownDestinations,
  extractMarkdownImageDestinations,
  findMarkdownDestinationParityIssues,
  findMarkdownImageParityIssues,
  normalizeMarkdownDestination,
};

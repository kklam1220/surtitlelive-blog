#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const {
  ROOT,
  loadConfig,
  ensureDir,
  readJson,
  writeJson,
  parseArgs,
  pickLocales,
  pickPosts,
  listSourcePosts,
} = require("./blog-i18n-utils.cjs");

function buildLocaleFilePath(localizedRoot, locale, slug) {
  return path.join(localizedRoot, locale, `${slug}.json`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const sourceDir = path.join(ROOT, config.sourceDir);
  const localizedRoot = path.join(ROOT, config.localizedDir);
  const locales = pickLocales(config.locales, args.locales);
  const sourcePosts = pickPosts(listSourcePosts(sourceDir), args.slugs);
  const expectedSlugs = new Set(sourcePosts.map((post) => post.slug));

  ensureDir(localizedRoot);

  let created = 0;
  let updated = 0;
  let removed = 0;

  for (const locale of locales) {
    const localeDir = path.join(localizedRoot, locale);
    ensureDir(localeDir);

    for (const post of sourcePosts) {
      const localeFilePath = buildLocaleFilePath(localizedRoot, locale, post.slug);
      const now = new Date().toISOString();
      const nextPayloadBase = {
        version: 1,
        locale,
        sourceLocale: config.sourceLocale || "en",
        slug: post.slug,
        sourcePath: post.relativePath,
        sourceHash: post.sourceHash,
      };

      if (!fs.existsSync(localeFilePath)) {
        const createdPayload = {
          ...nextPayloadBase,
          status: "pending_translation",
          updatedAt: now,
          translatedAt: null,
          frontmatter: {
            ...post.frontmatter,
          },
          body: post.body,
        };
        if (!args.dryRun) {
          writeJson(localeFilePath, createdPayload);
        }
        created += 1;
        continue;
      }

      const currentPayload = readJson(localeFilePath);
      const isStale = currentPayload.sourceHash !== post.sourceHash;
      const nextPayload = {
        ...currentPayload,
        ...nextPayloadBase,
        frontmatter: {
          ...(currentPayload.frontmatter && typeof currentPayload.frontmatter === "object"
            ? currentPayload.frontmatter
            : {}),
        },
        body: typeof currentPayload.body === "string" ? currentPayload.body : post.body,
      };

      if (isStale) {
        nextPayload.status = "pending_translation";
      }
      nextPayload.updatedAt = now;
      const changed = JSON.stringify(currentPayload) !== JSON.stringify(nextPayload);
      if (changed) {
        if (!args.dryRun) {
          writeJson(localeFilePath, nextPayload);
        }
        updated += 1;
      }
    }

    const localeFiles = fs
      .readdirSync(localeDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name);
    for (const fileName of localeFiles) {
      const slug = fileName.replace(/\.json$/, "");
      if (expectedSlugs.has(slug)) {
        continue;
      }
      if (!args.dryRun) {
        fs.unlinkSync(path.join(localeDir, fileName));
      }
      removed += 1;
    }
  }

  console.log(
    `[blog:i18n:sync] locales=${locales.length} posts=${sourcePosts.length} created=${created} updated=${updated} removed=${removed}${args.dryRun ? " (dry-run)" : ""}`,
  );
}

main();

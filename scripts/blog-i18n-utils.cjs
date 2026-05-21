#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "i18n", "blog-localization.config.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hashText(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}`);
  }
  const config = readJson(CONFIG_PATH);
  if (!config || typeof config !== "object") {
    throw new Error("Invalid localization config.");
  }
  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error("`locales` must be a non-empty array in config.");
  }
  return config;
}

function parseFrontmatter(fileContent) {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatterRaw: "", body: fileContent, frontmatter: {} };
  }

  const frontmatterRaw = match[1];
  const body = fileContent.slice(match[0].length);
  const frontmatter = {};
  const lines = frontmatterRaw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf(":");
    if (index <= 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      try {
        const normalized = rawValue.replace(/'/g, "\"");
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          frontmatter[key] = parsed.map((item) => String(item));
          continue;
        }
      } catch {
        // Fall back to plain string.
      }
    }

    if (
      (rawValue.startsWith("'") && rawValue.endsWith("'")) ||
      (rawValue.startsWith("\"") && rawValue.endsWith("\""))
    ) {
      frontmatter[key] = rawValue.slice(1, -1);
      continue;
    }
    frontmatter[key] = rawValue;
  }

  return { frontmatterRaw, body, frontmatter };
}

function listSourcePosts(sourceDirAbsolute) {
  const entries = fs
    .readdirSync(sourceDirAbsolute, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(md|mdx)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  return entries.map((fileName) => {
    const absolutePath = path.join(sourceDirAbsolute, fileName);
    const relativePath = path.relative(ROOT, absolutePath).replace(/\\/g, "/");
    const slug = fileName.replace(/\.(md|mdx)$/i, "");
    const source = fs.readFileSync(absolutePath, "utf8");
    const { frontmatter, body } = parseFrontmatter(source);
    const normalizedPayload = JSON.stringify(
      {
        slug,
        frontmatter,
        body,
      },
      null,
      2,
    );
    return {
      slug,
      fileName,
      absolutePath,
      relativePath,
      sourceText: source,
      frontmatter,
      body,
      sourceHash: hashText(normalizedPayload),
    };
  });
}

function parseArgs(argv) {
  const args = {
    locales: null,
    slugs: null,
    dryRun: false,
    force: false,
    model: null,
    baseUrl: null,
    provider: null,
    thinking: null,
  };

  for (const raw of argv) {
    if (raw === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (raw === "--force") {
      args.force = true;
      continue;
    }
    if (raw.startsWith("--locales=")) {
      args.locales = raw
        .slice("--locales=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }
    if (raw.startsWith("--slugs=")) {
      args.slugs = raw
        .slice("--slugs=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }
    if (raw.startsWith("--model=")) {
      args.model = raw.slice("--model=".length).trim();
      continue;
    }
    if (raw.startsWith("--base-url=")) {
      args.baseUrl = raw.slice("--base-url=".length).trim();
      continue;
    }
    if (raw.startsWith("--provider=")) {
      args.provider = raw.slice("--provider=".length).trim();
      continue;
    }
    if (raw === "--thinking") {
      args.thinking = true;
      continue;
    }
    if (raw === "--no-thinking") {
      args.thinking = false;
      continue;
    }
    if (raw.startsWith("--thinking=")) {
      const value = raw.slice("--thinking=".length).trim().toLowerCase();
      args.thinking = ["1", "true", "yes", "on", "enabled"].includes(value);
      continue;
    }
  }

  return args;
}

function pickLocales(configLocales, requestedLocales) {
  if (!requestedLocales || requestedLocales.length === 0) {
    return [...configLocales];
  }
  const set = new Set(configLocales);
  return requestedLocales.filter((locale) => set.has(locale));
}

function pickPosts(sourcePosts, requestedSlugs) {
  if (!requestedSlugs || requestedSlugs.length === 0) {
    return [...sourcePosts];
  }
  const set = new Set(requestedSlugs);
  return sourcePosts.filter((post) => set.has(post.slug));
}

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

module.exports = {
  ROOT,
  loadConfig,
  ensureDir,
  readJson,
  writeJson,
  hashText,
  parseArgs,
  pickLocales,
  pickPosts,
  listSourcePosts,
  loadEnvFromFile,
};

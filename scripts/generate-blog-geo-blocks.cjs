#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { GoogleAuth } = require("google-auth-library");
const {
  ROOT,
  ensureDir,
  readJson,
  writeJson,
  parseArgs,
  pickPosts,
  listSourcePosts,
  loadEnvFromFile,
} = require("./blog-i18n-utils.cjs");

const DEFAULT_GEO_LOCALES = ["en", "de", "fr", "ja", "zh-CN", "zh-TW"];

const LOCALE_DISPLAY_NAME = {
  ar: "Arabic",
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  id: "Indonesian",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pl: "Polish",
  pt: "Portuguese",
  ru: "Russian",
  th: "Thai",
  tr: "Turkish",
  uk: "Ukrainian",
  vi: "Vietnamese",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
};

function parseCliArgs(argv) {
  const base = parseArgs(argv);
  return {
    ...base,
    locales: base.locales ?? DEFAULT_GEO_LOCALES,
    force: base.force || false,
  };
}

let authClientPromise = null;

async function getGoogleAuthClient() {
  if (authClientPromise) return authClientPromise;
  const scopes = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/generative-language",
  ];
  authClientPromise = (async () => {
    const keyFilename =
      process.env.AI_GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const auth = keyFilename ? new GoogleAuth({ scopes, keyFilename }) : new GoogleAuth({ scopes });
    return auth.getClient();
  })();
  return authClientPromise;
}

async function getGeminiAuthConfig(explicitApiKey) {
  if (explicitApiKey) {
    return { apiKey: explicitApiKey, headers: {}, mode: "api-key" };
  }
  const client = await getGoogleAuthClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken =
    typeof accessTokenResponse === "string" ? accessTokenResponse : accessTokenResponse?.token;
  if (!accessToken) {
    throw new Error("Unable to acquire Google OAuth access token for Gemini.");
  }
  return {
    apiKey: null,
    mode: "oauth",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

function tryParseJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function callGemini({ endpoint, headers, prompt }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 400)}`);
  }
  const json = await response.json();
  const parts = json?.candidates?.[0]?.content?.parts;
  const content = Array.isArray(parts) ? parts.map((part) => part?.text || "").join("\n").trim() : "";
  if (!content) {
    throw new Error("Gemini returned empty content.");
  }
  return content;
}

function buildPrompt({ locale, title, body }) {
  const localeDisplay = LOCALE_DISPLAY_NAME[locale] || locale;
  return [
    `You are an expert SEO + AEO editor for theatre surtitling software.`,
    `Language target: ${localeDisplay} (${locale}).`,
    "Task: Generate concise, high-value answer blocks for AI/search snippets.",
    "Rules:",
    "- Keep domain terms accurate: script=theatre play script; cue=stage/surtitle cue; character=dramatic role.",
    "- Do not invent product features not present in source.",
    "- Output strict JSON only.",
    "- JSON shape:",
    '{ "sectionTitles": { "keyTakeaways": "...", "faq": "...", "glossary": "...", "related": "..." }, "keyTakeaways": ["..."], "faq": [{"question":"...","answer":"..."}], "glossary": [{"term":"...","definition":"..."}] }',
    "- keyTakeaways: exactly 4 items; each <= 22 words.",
    "- faq: exactly 4 Q/A pairs; each answer <= 70 words.",
    "- glossary: exactly 5 items.",
    "",
    `Title: ${title}`,
    "",
    body.slice(0, 12000),
  ].join("\n");
}

function loadTargetPostContent(locale, sourcePost) {
  if (locale === "en") {
    return {
      title: sourcePost.frontmatter?.title || sourcePost.slug,
      body: sourcePost.body || "",
      sourceHash: sourcePost.sourceHash,
    };
  }
  const localizedPath = path.join(ROOT, "src", "content", "i18n", "blog", locale, `${sourcePost.slug}.json`);
  if (!fs.existsSync(localizedPath)) {
    return null;
  }
  const localized = readJson(localizedPath);
  if (!localized || localized.status !== "translated") {
    return null;
  }
  return {
    title: localized.frontmatter?.title || sourcePost.frontmatter?.title || sourcePost.slug,
    body: localized.body || sourcePost.body || "",
    sourceHash: localized.sourceHash || sourcePost.sourceHash,
  };
}

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  const sourcePosts = pickPosts(listSourcePosts(path.join(ROOT, "src", "content", "blog")), args.slugs);

  loadEnvFromFile(path.join(ROOT, "..", "backend", ".env"));
  loadEnvFromFile(path.join(ROOT, ".env"));

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GENAI_API_KEY ||
    process.env.AI_GEMINI_API_KEY;
  const authConfig = await getGeminiAuthConfig(apiKey);
  const model = args.model || process.env.GEMINI_BLOG_MODEL || "gemini-2.0-flash";
  const baseUrl = args.baseUrl || process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
  const endpointBase = `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent`;
  const endpoint =
    authConfig.mode === "api-key"
      ? `${endpointBase}?key=${encodeURIComponent(authConfig.apiKey)}`
      : endpointBase;

  let generated = 0;
  let skipped = 0;

  for (const locale of args.locales) {
    for (const post of sourcePosts) {
      const localeContent = loadTargetPostContent(locale, post);
      if (!localeContent) {
        skipped += 1;
        continue;
      }
      const outPath = path.join(ROOT, "src", "content", "i18n", "geo", locale, `${post.slug}.json`);
      if (!args.force && fs.existsSync(outPath)) {
        try {
          const current = JSON.parse(fs.readFileSync(outPath, "utf8"));
          if (current && current.sourceHash === localeContent.sourceHash) {
            skipped += 1;
            continue;
          }
        } catch {
          // regenerate
        }
      }

      console.log(`[blog:geo] [${locale}] ${post.slug} generating...`);
      const prompt = buildPrompt({
        locale,
        title: localeContent.title,
        body: localeContent.body,
      });
      const raw = await callGemini({
        endpoint,
        headers: authConfig.headers,
        prompt,
      });
      const parsed = tryParseJsonObject(raw);
      if (!parsed || typeof parsed !== "object") {
        throw new Error(`Failed to parse GEO JSON output for ${locale}/${post.slug}`);
      }
      const payload = {
        version: 1,
        locale,
        slug: post.slug,
        sourceHash: localeContent.sourceHash,
        generatedAt: new Date().toISOString(),
        sectionTitles:
          parsed.sectionTitles && typeof parsed.sectionTitles === "object"
            ? parsed.sectionTitles
            : {
                keyTakeaways: "Key Takeaways",
                faq: "FAQ",
                glossary: "Glossary",
                related: "Related Articles",
              },
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.map((item) => String(item)) : [],
        faq: Array.isArray(parsed.faq)
          ? parsed.faq.map((item) => ({
              question: String(item?.question || ""),
              answer: String(item?.answer || ""),
            }))
          : [],
        glossary: Array.isArray(parsed.glossary)
          ? parsed.glossary.map((item) => ({
              term: String(item?.term || ""),
              definition: String(item?.definition || ""),
            }))
          : [],
      };
      ensureDir(path.dirname(outPath));
      if (!args.dryRun) {
        writeJson(outPath, payload);
      }
      generated += 1;
      console.log(`[blog:geo] [${locale}] ${post.slug} done`);
    }
  }

  console.log(`[blog:geo] generated=${generated} skipped=${skipped}${args.dryRun ? " (dry-run)" : ""}`);
}

main().catch((error) => {
  console.error(`[blog:geo] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

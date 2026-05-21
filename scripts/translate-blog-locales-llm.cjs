#!/usr/bin/env node

const path = require("node:path");
const { GoogleAuth } = require("google-auth-library");
const {
  ROOT,
  loadConfig,
  readJson,
  writeJson,
  parseArgs,
  pickLocales,
  pickPosts,
  listSourcePosts,
  loadEnvFromFile,
} = require("./blog-i18n-utils.cjs");

const DEFAULT_DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DEFAULT_DASHSCOPE_DEEPSEEK_MODEL = "deepseek-v4-pro";

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

const LOCALE_PRIMARY_SHOW_LANGUAGE = {
  ar: "Arabic",
  de: "German",
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
  "zh-CN": "Mandarin Chinese",
  "zh-TW": "Mandarin Chinese",
};

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

function normalizeTranslatedPayload(parsed, source) {
  const title = typeof parsed.title === "string" ? parsed.title : source.frontmatter?.title || "";
  const description =
    typeof parsed.description === "string" ? parsed.description : source.frontmatter?.description || "";
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map((tag) => String(tag))
    : Array.isArray(source.frontmatter?.tags)
      ? source.frontmatter.tags
      : [];
  const body = typeof parsed.body === "string" ? parsed.body : source.body;

  return { title, description, tags, body };
}

function normalizeProvider(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["dashscope", "dashscope-deepseek", "deepseek", "alibabacloud", "aliyun"].includes(normalized)) {
    return "dashscope-deepseek";
  }
  return "gemini";
}

function booleanFromEnv(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }
  return ["1", "true", "yes", "on", "enabled"].includes(String(value).trim().toLowerCase());
}

function chatCompletionsEndpoint(baseUrl) {
  const trimmed = String(baseUrl || DEFAULT_DASHSCOPE_BASE_URL).trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function buildPrompt({ locale, source }) {
  const localeDisplay = LOCALE_DISPLAY_NAME[locale] || locale;
  const localizedArticleInstructions = getLocalizedArticleInstructions(locale, source);
  const payload = {
    title: source.frontmatter?.title || "",
    description: source.frontmatter?.description || "",
    tags: Array.isArray(source.frontmatter?.tags) ? source.frontmatter.tags : [],
    body: source.body || "",
  };
  return [
    "You are a senior localization linguist for a theatre surtitling SaaS platform.",
    `Translate from English to ${localeDisplay} (${locale}).`,
    "Requirements:",
    "- Keep theater-domain terminology accurate and consistent.",
    "- script = theatre play script (never software script).",
    "- character = dramatic role/persona (never text character/codepoint).",
    "- cue = stage/surtitle cue, not clue/hint.",
    "- performance = live stage performance.",
    "- operator cockpit = control console.",
    "- For zh-TW prefer 劇本, 角色, 控制台. For zh-CN prefer 剧本, 角色, 控制台.",
    "- Treat each locale as a first-class public edition. Do not add machine-translation disclaimers, locale-code labels, or notes that English prevails.",
    "- Localize illustrative script examples for the target language when they are examples rather than quoted source material. For example, replace a Chinese sample such as 張三：今天下雨 with a natural target-language speaker/dialogue sample.",
    "- Preserve markdown structure exactly (headings, lists, links, code blocks, HTML tags).",
    "- Do not wrap the body in a markdown code fence such as ```markdown.",
    '- Do not include JSON-LD or <script type="application/ld+json"> blocks in the translated body.',
    "- Do not alter URLs, image paths, code blocks, or frontmatter key names.",
    ...localizedArticleInstructions,
    '- Return strict JSON only: {"title":"...","description":"...","tags":["..."],"body":"..."}',
    "",
    JSON.stringify(payload),
  ].join("\n");
}

function getLocalizedArticleInstructions(locale, source) {
  if (source.slug !== "9-english-surtitles-non-english-show-fringe") {
    return [];
  }

  const showLanguage = LOCALE_PRIMARY_SHOW_LANGUAGE[locale];
  if (!showLanguage) {
    return [];
  }

  return [
    `- For the opening sentence of this article, localize the show-language example to the target locale: translate the meaning of "If your ${showLanguage} or other non-English show is going to the Edinburgh Fringe, the question is usually not abstract." Do not preserve the English source list "French, German, Spanish" in that sentence.`,
  ];
}

async function callGeminiText({ endpoint, headers, text }) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.15,
      },
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const json = await response.json();
  const parts = json?.candidates?.[0]?.content?.parts;
  const content = Array.isArray(parts) ? parts.map((part) => part?.text || "").join("\n").trim() : "";
  if (!content) {
    throw new Error("Gemini returned empty response content.");
  }
  return content;
}

async function translateWithGemini({ apiKey, baseUrl, model, locale, source }) {
  const authConfig = await getGeminiAuthConfig(apiKey);
  const endpointBase = `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent`;
  const endpoint =
    authConfig.mode === "api-key"
      ? `${endpointBase}?key=${encodeURIComponent(authConfig.apiKey)}`
      : endpointBase;
  const prompt = buildPrompt({ locale, source });
  const headers = {
    "Content-Type": "application/json",
    ...authConfig.headers,
  };
  const content = await callGeminiText({
    endpoint,
    headers,
    text: `Return strict JSON only. No markdown fences.\n${prompt}`,
  });
  const parsed = tryParseJsonObject(content);
  if (parsed && typeof parsed === "object") {
    return normalizeTranslatedPayload(parsed, source);
  }

  const localeDisplay = LOCALE_DISPLAY_NAME[locale] || locale;
  const title = await callGeminiText({
    endpoint,
    headers,
    text: [
      `Translate from English to ${localeDisplay} (${locale}).`,
      "Return only translated title text.",
      "The domain is theatre surtitles software.",
      `Title: ${source.frontmatter?.title || ""}`,
    ].join("\n"),
  });
  const description = await callGeminiText({
    endpoint,
    headers,
    text: [
      `Translate from English to ${localeDisplay} (${locale}).`,
      "Return only translated description text.",
      "Preserve product/domain meaning for theatre surtitles.",
      `Description: ${source.frontmatter?.description || ""}`,
    ].join("\n"),
  });
  const translatedTagsRaw = await callGeminiText({
    endpoint,
    headers,
    text: [
      `Translate from English to ${localeDisplay} (${locale}).`,
      'Return strict JSON only as {"tags":["..."]}.',
      JSON.stringify({ tags: Array.isArray(source.frontmatter?.tags) ? source.frontmatter.tags : [] }),
    ].join("\n"),
  });
  const translatedTagsParsed = tryParseJsonObject(translatedTagsRaw);
  const tags = Array.isArray(translatedTagsParsed?.tags)
    ? translatedTagsParsed.tags.map((tag) => String(tag))
    : Array.isArray(source.frontmatter?.tags)
      ? source.frontmatter.tags
      : [];
  const body = await callGeminiText({
    endpoint,
    headers,
    text: [
      `Translate the following markdown body from English to ${localeDisplay} (${locale}).`,
      "Return markdown only.",
      "Preserve headings, lists, links, code blocks, HTML tags, and all URLs/image paths.",
      "Do not wrap the returned body in a markdown code fence such as ```markdown.",
      'Do not include JSON-LD or <script type="application/ld+json"> blocks in the translated body.',
      "Use theatre-domain terminology (劇本/角色/控制台 for zh-TW; 剧本/角色/控制台 for zh-CN).",
      ...getLocalizedArticleInstructions(locale, source),
      "",
      source.body || "",
    ].join("\n"),
  });

  return { title: title.trim(), description: description.trim(), tags, body };
}

async function callDashScopeChatStreamingText({ apiKey, baseUrl, model, text, enableThinking, maxTokens }) {
  const response = await fetch(chatCompletionsEndpoint(baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: text }],
      temperature: 0.15,
      response_format: { type: "json_object" },
      enable_thinking: enableThinking,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DashScope DeepSeek request failed (${response.status}): ${body.slice(0, 500)}`);
  }
  if (!response.body || typeof response.body.getReader !== "function") {
    throw new Error("DashScope DeepSeek returned a non-streaming response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const data = trimmed.slice("data:".length).trim();
      if (!data || data === "[DONE]") {
        continue;
      }
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = parsed?.choices?.[0]?.delta;
      if (typeof delta?.content === "string") {
        content += delta.content;
      }
      // Do not persist or print reasoning_content; locale payloads store final copy only.
    }
  }

  content = content.trim();
  if (!content) {
    throw new Error("DashScope DeepSeek returned empty final content.");
  }
  return content;
}

async function translateWithDashScopeDeepSeek({ apiKey, baseUrl, model, locale, source, enableThinking, maxTokens }) {
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY or QWEN_API_KEY for DashScope DeepSeek blog translation.");
  }
  const prompt = buildPrompt({ locale, source });
  const content = await callDashScopeChatStreamingText({
    apiKey,
    baseUrl,
    model,
    locale,
    enableThinking,
    maxTokens,
    text: `Return strict JSON only. No markdown fences.\n${prompt}`,
  });
  const parsed = tryParseJsonObject(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`DashScope DeepSeek did not return parseable translation JSON: ${content.slice(0, 500)}`);
  }
  return normalizeTranslatedPayload(parsed, source);
}

let authClientPromise = null;

async function getGoogleAuthClient() {
  if (authClientPromise) {
    return authClientPromise;
  }
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
    return { mode: "api-key", apiKey: explicitApiKey, headers: {} };
  }

  const client = await getGoogleAuthClient();
  const accessTokenResponse = await client.getAccessToken();
  const accessToken =
    typeof accessTokenResponse === "string" ? accessTokenResponse : accessTokenResponse?.token;
  if (!accessToken) {
    throw new Error("Unable to acquire Google OAuth access token for Gemini.");
  }

  const quotaProjectId =
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_PROJECT_ID ||
    process.env.CLOUD_TASKS_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;

  return {
    mode: "oauth",
    apiKey: null,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(quotaProjectId ? { "x-goog-user-project": quotaProjectId } : {}),
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const sourceDir = path.join(ROOT, config.sourceDir);
  const localizedRoot = path.join(ROOT, config.localizedDir);
  const locales = pickLocales(config.locales, args.locales);
  const posts = pickPosts(listSourcePosts(sourceDir), args.slugs);

  const repoEnvPath = path.join(ROOT, "..", ".env");
  const backendEnvPath = path.join(ROOT, "..", "backend", ".env");
  const blogEnvPath = path.join(ROOT, ".env");
  loadEnvFromFile(repoEnvPath);
  loadEnvFromFile(backendEnvPath);
  loadEnvFromFile(blogEnvPath);

  const provider = normalizeProvider(args.provider || process.env.BLOG_TRANSLATION_PROVIDER || "gemini");
  const apiKey = provider === "dashscope-deepseek"
    ? process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY
    : process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GENAI_API_KEY ||
      process.env.AI_GEMINI_API_KEY;
  const model = provider === "dashscope-deepseek"
    ? args.model ||
      process.env.DASHSCOPE_DEEPSEEK_BLOG_MODEL ||
      process.env.DEEPSEEK_BLOG_MODEL ||
      process.env.DASHSCOPE_DEEPSEEK_MODEL_TRANSLATE ||
      process.env.DEEPSEEK_MODEL_TRANSLATE ||
      DEFAULT_DASHSCOPE_DEEPSEEK_MODEL
    : args.model || process.env.GEMINI_BLOG_MODEL || config.gemini?.model || "gemini-2.0-flash";
  const baseUrl = provider === "dashscope-deepseek"
    ? args.baseUrl || process.env.DASHSCOPE_BASE_URL || process.env.QWEN_BASE_URL || DEFAULT_DASHSCOPE_BASE_URL
    : args.baseUrl || process.env.GEMINI_BASE_URL || config.gemini?.baseUrl;
  const enableThinking = args.thinking !== null
    ? args.thinking
    : booleanFromEnv(
      process.env.BLOG_TRANSLATION_ENABLE_THINKING ||
        process.env.DASHSCOPE_DEEPSEEK_ENABLE_THINKING ||
        process.env.DEEPSEEK_ENABLE_THINKING,
      provider === "dashscope-deepseek",
    );
  const maxTokens = Number.parseInt(process.env.BLOG_TRANSLATION_MAX_TOKENS || process.env.DASHSCOPE_MAX_TOKENS || "60000", 10);
  let translated = 0;
  let skipped = 0;

  for (const locale of locales) {
    for (const post of posts) {
      const localePath = path.join(localizedRoot, locale, `${post.slug}.json`);
      let payload;
      try {
        payload = readJson(localePath);
      } catch {
        console.warn(`[blog:i18n:translate:llm] skip missing locale file: ${localePath}`);
        skipped += 1;
        continue;
      }

      const isStale = payload.sourceHash !== post.sourceHash;
      const needsTranslate = args.force || isStale || payload.status !== "translated";
      if (!needsTranslate) {
        skipped += 1;
        continue;
      }

      console.log(`[blog:i18n:translate:llm] [${locale}] ${post.slug} translating with ${provider}/${model}...`);
      const result = provider === "dashscope-deepseek"
        ? await translateWithDashScopeDeepSeek({
          apiKey,
          baseUrl,
          model,
          locale,
          source: post,
          enableThinking,
          maxTokens,
        })
        : await translateWithGemini({
          apiKey,
          baseUrl,
          model,
          locale,
          source: post,
        });

      payload.frontmatter = {
        ...(payload.frontmatter && typeof payload.frontmatter === "object" ? payload.frontmatter : {}),
        ...post.frontmatter,
        title: result.title,
        description: result.description,
        tags: result.tags,
      };
      payload.body = result.body;
      payload.sourceHash = post.sourceHash;
      payload.status = "translated";
      payload.translatedAt = new Date().toISOString();
      payload.updatedAt = new Date().toISOString();

      if (!args.dryRun) {
        writeJson(localePath, payload);
      }
      translated += 1;
      console.log(`[blog:i18n:translate:llm] [${locale}] ${post.slug} done`);
    }
  }

  console.log(
    `[blog:i18n:translate:llm] locales=${locales.length} posts=${posts.length} translated=${translated} skipped=${skipped}${args.dryRun ? " (dry-run)" : ""}`,
  );
}

main().catch((error) => {
  console.error(`[blog:i18n:translate:llm] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

import fs from "node:fs";
import path from "node:path";

type LocalizedFrontmatter = {
  title: string;
  description: string;
  pubDate?: string;
  updatedDate?: string;
  tags?: string[];
  heroImage?: string;
};

export type LocalizedBlogPayload = {
  version: number;
  locale: string;
  sourceLocale: string;
  slug: string;
  sourcePath: string;
  sourceHash: string;
  status: string;
  translatedAt: string | null;
  updatedAt: string | null;
  frontmatter: LocalizedFrontmatter;
  body: string;
};

const LOCALIZED_ROOT = path.join(process.cwd(), "src", "content", "i18n", "blog");

export function listLocalizedLocales(): string[] {
  if (!fs.existsSync(LOCALIZED_ROOT)) {
    return [];
  }
  return fs
    .readdirSync(LOCALIZED_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function listLocalizedSlugs(locale: string): string[] {
  const localeDir = path.join(LOCALIZED_ROOT, locale);
  if (!fs.existsSync(localeDir)) {
    return [];
  }
  return fs
    .readdirSync(localeDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/i, ""))
    .sort();
}

export function readLocalizedPost(locale: string, slug: string): LocalizedBlogPayload | null {
  const filePath = path.join(LOCALIZED_ROOT, locale, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  return parsed as LocalizedBlogPayload;
}

export function listLocalizedPostsForLocale(locale: string): LocalizedBlogPayload[] {
  const slugs = listLocalizedSlugs(locale);
  const items = slugs
    .map((slug) => readLocalizedPost(locale, slug))
    .filter((item): item is LocalizedBlogPayload => Boolean(item))
    .filter((item) => item.status === "translated");

  return items.sort((a, b) => {
    const dateA = Date.parse(a.frontmatter.pubDate || "");
    const dateB = Date.parse(b.frontmatter.pubDate || "");
    return Number.isNaN(dateB) || Number.isNaN(dateA) ? 0 : dateB - dateA;
  });
}

export function listLocalizedLocalesForSlug(slug: string): string[] {
  return listLocalizedLocales().filter((locale) => {
    const payload = readLocalizedPost(locale, slug);
    return Boolean(payload && payload.status === "translated");
  });
}

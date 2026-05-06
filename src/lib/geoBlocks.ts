import fs from "node:fs";
import path from "node:path";

export type GeoFaqItem = {
  question: string;
  answer: string;
};

export type GeoGlossaryItem = {
  term: string;
  definition: string;
};

export type GeoBlockPayload = {
  version: number;
  locale: string;
  slug: string;
  sourceHash: string;
  generatedAt: string;
  sectionTitles?: {
    keyTakeaways?: string;
    faq?: string;
    glossary?: string;
    related?: string;
  };
  keyTakeaways: string[];
  faq: GeoFaqItem[];
  glossary: GeoGlossaryItem[];
};

const GEO_ROOT = path.join(process.cwd(), "src", "content", "i18n", "geo");

export function readGeoBlock(locale: string, slug: string): GeoBlockPayload | null {
  const filePath = path.join(GEO_ROOT, locale, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  return parsed as GeoBlockPayload;
}

function normalizeHeading(value: string): string {
  return value
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function listMarkdownHeadings(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^#{2,6}\s+(.+?)\s*#*\s*$/)?.[1] ?? "")
    .filter(Boolean)
    .map(normalizeHeading);
}

export function hasAuthoredGeoSection(markdown: string, geoBlock: GeoBlockPayload | null): boolean {
  const headings = new Set(listMarkdownHeadings(markdown));
  const sectionTitles = geoBlock?.sectionTitles;
  const candidates = [
    "Key Takeaways",
    "FAQ",
    "Glossary",
    sectionTitles?.keyTakeaways,
    sectionTitles?.faq,
    sectionTitles?.glossary,
  ]
    .filter((item): item is string => Boolean(item))
    .map(normalizeHeading);

  return candidates.some((candidate) => headings.has(candidate));
}

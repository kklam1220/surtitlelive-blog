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

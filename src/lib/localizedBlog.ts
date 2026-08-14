import fs from "node:fs";
import path from "node:path";
import { isBlogArticleIndexable, isBlogIndexedLocale, isBlogSupportedLocale, type BlogSupportedLocale } from "../i18n/locale-config";

type LocalizedFrontmatter = {
  title: string;
  description: string;
  pubDate?: string;
  updatedDate?: string;
  tags?: string[];
  heroImage?: string;
  heroImageAlt?: string;
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
const SOURCE_ROOT = path.join(process.cwd(), "src", "content", "blog");

type LocalizedScriptExample = {
  punctuationBlock: string;
  characterPattern: string;
  colonExamples: [string, string];
};

const LOCALIZED_SCRIPT_EXAMPLES: Partial<Record<BlogSupportedLocale, LocalizedScriptExample>> = {
  ar: {
    punctuationBlock: "> **مريم: إنها تمطر اليوم.**\n> **سامر: حقا؟**\n> **(ينظران إلى النافذة.)**",
    characterPattern: "الشخصية: الحوار",
    colonExamples: ["مريم: إنها تمطر اليوم", "سامر: حقا؟"],
  },
  de: {
    punctuationBlock: "> **ANNA: Heute regnet es.**\n> **BEN: Wirklich?**\n> **(Sie schauen zum Fenster.)**",
    characterPattern: "Figur: Dialog",
    colonExamples: ["ANNA: Heute regnet es", "BEN: Wirklich?"],
  },
  es: {
    punctuationBlock: "> **ANA: Hoy llueve.**\n> **BEN: ¿De verdad?**\n> **(Miran hacia la ventana.)**",
    characterPattern: "Personaje: Diálogo",
    colonExamples: ["ANA: Hoy llueve", "BEN: ¿De verdad?"],
  },
  fr: {
    punctuationBlock: "> **ANNE : Il pleut aujourd'hui.**\n> **BENOIT : Vraiment ?**\n> **(Ils regardent vers la fenêtre.)**",
    characterPattern: "Personnage : réplique",
    colonExamples: ["ANNE : Il pleut aujourd'hui", "BENOIT : Vraiment ?"],
  },
  id: {
    punctuationBlock: "> **ANI: Hari ini hujan.**\n> **BUDI: Benarkah?**\n> **(Mereka melihat ke luar jendela.)**",
    characterPattern: "Tokoh: Dialog",
    colonExamples: ["ANI: Hari ini hujan", "BUDI: Benarkah?"],
  },
  it: {
    punctuationBlock: "> **ANNA: Oggi piove.**\n> **LUCA: Davvero?**\n> **(Guardano fuori dalla finestra.)**",
    characterPattern: "Personaggio: battuta",
    colonExamples: ["ANNA: Oggi piove", "LUCA: Davvero?"],
  },
  ja: {
    punctuationBlock: "> **太郎：今日は雨です。**\n> **花子：本当ですか？**\n> **（二人は窓の外を見る）**",
    characterPattern: "登場人物：台詞",
    colonExamples: ["太郎：今日は雨です", "花子：本当ですか？"],
  },
  ko: {
    punctuationBlock: "> **민수: 오늘 비가 옵니다.**\n> **지은: 정말요?**\n> **(두 사람은 창밖을 바라본다.)**",
    characterPattern: "등장인물: 대사",
    colonExamples: ["민수: 오늘 비가 옵니다", "지은: 정말요?"],
  },
  pl: {
    punctuationBlock: "> **ANNA: Dzisiaj pada deszcz.**\n> **PIOTR: Naprawdę?**\n> **(Patrzą przez okno.)**",
    characterPattern: "Postać: dialog",
    colonExamples: ["ANNA: Dzisiaj pada deszcz", "PIOTR: Naprawdę?"],
  },
  pt: {
    punctuationBlock: "> **ANA: Hoje está chovendo.**\n> **BRUNO: Sério?**\n> **(Eles olham pela janela.)**",
    characterPattern: "Personagem: diálogo",
    colonExamples: ["ANA: Hoje está chovendo", "BRUNO: Sério?"],
  },
  ru: {
    punctuationBlock: "> **АННА: Сегодня идет дождь.**\n> **БОРИС: Правда?**\n> **(Они смотрят в окно.)**",
    characterPattern: "Персонаж: реплика",
    colonExamples: ["АННА: Сегодня идет дождь", "БОРИС: Правда?"],
  },
  th: {
    punctuationBlock: "> **มาลี: วันนี้ฝนตก**\n> **นนท์: จริงหรือ?**\n> **(ทั้งสองมองออกไปนอกหน้าต่าง)**",
    characterPattern: "ตัวละคร: บทพูด",
    colonExamples: ["มาลี: วันนี้ฝนตก", "นนท์: จริงหรือ?"],
  },
  tr: {
    punctuationBlock: "> **AYSE: Bugün yağmur yağıyor.**\n> **EMRE: Gerçekten mi?**\n> **(Pencereden dışarı bakarlar.)**",
    characterPattern: "Karakter: replik",
    colonExamples: ["AYSE: Bugün yağmur yağıyor", "EMRE: Gerçekten mi?"],
  },
  uk: {
    punctuationBlock: "> **АННА: Сьогодні йде дощ.**\n> **БОГДАН: Справді?**\n> **(Вони дивляться у вікно.)**",
    characterPattern: "Персонаж: репліка",
    colonExamples: ["АННА: Сьогодні йде дощ", "БОГДАН: Справді?"],
  },
  vi: {
    punctuationBlock: "> **AN: Hôm nay trời mưa.**\n> **BÌNH: Thật sao?**\n> **(Họ nhìn ra ngoài cửa sổ.)**",
    characterPattern: "Nhân vật: lời thoại",
    colonExamples: ["AN: Hôm nay trời mưa", "BÌNH: Thật sao?"],
  },
  "zh-CN": {
    punctuationBlock: "> **张三：今天下雨。**\n> **李四：真的吗？**\n> **（他们望向窗外）**",
    characterPattern: "角色：台词",
    colonExamples: ["张三：今天下雨", "李四：真的吗"],
  },
  "zh-TW": {
    punctuationBlock: "> **張三：今天下雨。**\n> **李四：真的嗎？**\n> **（他們望向窗外）**",
    characterPattern: "角色：台詞",
    colonExamples: ["張三：今天下雨", "李四：真的嗎"],
  },
};

function localizeKnownScriptExamples(locale: string, slug: string, body: string): string {
  if (!isBlogSupportedLocale(locale) || locale === "en") {
    return body;
  }
  const example = LOCALIZED_SCRIPT_EXAMPLES[locale];
  if (!example) {
    return body;
  }

  let nextBody = body;
  if (slug === "7-geometry-of-dramatic-parsing") {
    nextBody = nextBody
      .replace(
        /> \*\*(?:張三：今天下雨。|张三：今天下雨。)\*\*[^\n]*\r?\n> \*\*(?:李四：真的嗎？|李四：真的吗？)\*\*[^\n]*\r?\n> \*\*(?:（他們望向窗外）|（他们望向窗外）)\*\*[^\n]*/g,
        example.punctuationBlock,
      )
      .replace(/\*\*(?:角色：台詞|角色：台词)\*\*(?: \([^)]*\))?/g, `**${example.characterPattern}**`)
      .replace(/角色：台詞|角色：台词/g, example.characterPattern);
  }

  if (
    slug === "7-geometry-of-dramatic-parsing" ||
    slug === "8-from-layout-to-archetype-detection"
  ) {
    nextBody = nextBody
      .replace(/`HAMLET: To be` or `張三：今天下雨`/g, `\`${example.colonExamples[0]}\` or \`${example.colonExamples[1]}\``)
      .replace(/`張三：今天下雨`/g, `\`${example.colonExamples[0]}\``)
      .replace(/張三：今天下雨/g, example.colonExamples[0]);
  }

  return nextBody;
}

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
    .filter((slug) => hasPublishedSourcePost(slug))
    .sort();
}

export function readLocalizedPost(locale: string, slug: string): LocalizedBlogPayload | null {
  if (!hasPublishedSourcePost(slug)) {
    return null;
  }
  const filePath = path.join(LOCALIZED_ROOT, locale, `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  const payload = parsed as LocalizedBlogPayload;
  if (typeof payload.body === "string") {
    payload.body = localizeKnownScriptExamples(payload.locale, payload.slug, payload.body);
  }
  return payload;
}

function hasPublishedSourcePost(slug: string): boolean {
  return [".md", ".mdx"].some((extension) => {
    const fileName = `${slug}${extension}`;
    return fs.existsSync(path.join(SOURCE_ROOT, fileName)) && !fileName.startsWith("_");
  });
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

export function listIndexedLocalizedLocales(): string[] {
  return listLocalizedLocales().filter((locale) => isBlogIndexedLocale(locale));
}

export function listIndexedLocalizedLocalesForSlug(slug: string): string[] {
  return listLocalizedLocalesForSlug(slug).filter((locale) => isBlogArticleIndexable(locale, slug));
}

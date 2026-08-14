import type { ImageMetadata } from "astro";

import blog11 from "../content/blog/blog-1-1.jpg";
import blog12 from "../content/blog/blog-1-2.jpg";
import blog2 from "../content/blog/blog-2.jpg";
import blog3 from "../content/blog/blog-3.jpg";
import blog41 from "../content/blog/blog-4.1.jpg";
import blog4 from "../content/blog/blog-4.jpg";
import blog51 from "../content/blog/blog-5.1.jpg";
import blog52 from "../content/blog/blog-5.2.jpg";
import blog61 from "../content/blog/blog-6-1.png";
import blog8 from "../content/blog/blog-8.png";
import blog91 from "../content/blog/blog-9-1.png";
import blog92 from "../content/blog/blog-9-2.png";
import blog93 from "../content/blog/blog-9-3.jpg";
import blog94 from "../content/blog/blog-9-4.png";
import blog101 from "../content/blog/blog-10-1.png";
import blog11Hero from "../content/blog/blog-11.png";
import blog12Hero from "../content/blog/blog-12.png";
import blog14Hero from "../content/blog/blog-14.png";
import favicon192 from "../content/blog/favicon-192.png";
import scriptParsingTheatreSubtitles from "../content/blog/script-parsing-theatre-subtitles.png";
import blog131 from "../content/blog/blog-13-1.png";
import blog132 from "../content/blog/blog-13-2.png";
import blog134 from "../content/blog/blog-13-4.gif";
import blog15Hero from "../content/blog/blog-15.png";
import blog16Hero from "../content/blog/blog-16.png";

const BLOG_IMAGES: Record<string, ImageMetadata> = {
  "blog-1-1.jpg": blog11,
  "blog-1-2.jpg": blog12,
  "blog-2.jpg": blog2,
  "blog-3.jpg": blog3,
  "blog-4.1.jpg": blog41,
  "blog-4.jpg": blog4,
  "blog-5.1.jpg": blog51,
  "blog-5.2.jpg": blog52,
  "blog-6-1.png": blog61,
  "blog-8.png": blog8,
  "blog-9-1.png": blog91,
  "blog-9-2.png": blog92,
  "blog-9-3.jpg": blog93,
  "blog-9-4.png": blog94,
  "blog-10-1.png": blog101,
  "blog-11.png": blog11Hero,
  "blog-12.png": blog12Hero,
  "blog-14.png": blog14Hero,
  "blog-13-1.png": blog131,
  "blog-13-2.png": blog132,
  "blog-13-4.gif": blog134,
  "blog-15.png": blog15Hero,
  "blog-16.png": blog16Hero,
  "favicon-192.png": favicon192,
  "script-parsing-theatre-subtitles.png": scriptParsingTheatreSubtitles,
};

function normalizeBlogImageSource(src?: string | null): string | null {
  if (!src) {
    return null;
  }

  const trimmed = src.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return null;
  }

  return trimmed.replace(/^\.?\//, "");
}

export function resolveBlogImage(src?: string | null): ImageMetadata | undefined {
  const normalized = normalizeBlogImageSource(src);
  return normalized ? BLOG_IMAGES[normalized] : undefined;
}

export function resolveBlogImageUrl(src?: string | null): string | undefined {
  return resolveBlogImage(src)?.src;
}

export function rewriteLocalizedBlogImageReferences(markdown: string): string {
  const importedImages = new Map<string, string>();
  let rewritten = markdown.replace(
    /^[ \t]*import\s+([A-Za-z_$][\w$]*)\s+from\s+["'](\.\/[^"']+\.(?:avif|gif|jpe?g|png|webp))["'];?[ \t]*(?:\r?\n){1,2}/gim,
    (_match, variableName: string, imageSource: string) => {
      const imageUrl = resolveBlogImageUrl(imageSource);
      if (imageUrl) {
        importedImages.set(variableName, imageUrl);
      }
      return "";
    },
  );

  rewritten = rewritten.replace(
    /src=\{([A-Za-z_$][\w$]*)\.src\}/g,
    (match, variableName: string) => {
      const imageUrl = importedImages.get(variableName);
      return imageUrl ? `src="${imageUrl}"` : match;
    },
  );

  rewritten = rewritten.replace(
    /(!\[[^\]]*\]\()(\.\/[^)\s]+\.(?:avif|gif|jpe?g|png|webp))(\))/gi,
    (match, prefix: string, imageSource: string, suffix: string) => {
      const imageUrl = resolveBlogImageUrl(imageSource);
      return imageUrl ? `${prefix}${imageUrl}${suffix}` : match;
    },
  );

  rewritten = rewritten.replace(
    /(<img\b[^>]*\bsrc=)(["'])(\.\/[^"']+\.(?:avif|gif|jpe?g|png|webp))\2/gi,
    (match, prefix: string, quote: string, imageSource: string) => {
      const imageUrl = resolveBlogImageUrl(imageSource);
      return imageUrl ? `${prefix}${quote}${imageUrl}${quote}` : match;
    },
  );

  return rewritten;
}

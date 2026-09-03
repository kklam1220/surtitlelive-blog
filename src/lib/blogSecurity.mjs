import sanitizeHtml from "sanitize-html";

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  "figure",
  "figcaption",
  "img",
  "iframe",
  "pre",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
];

export function sanitizeLocalizedBlogHtml(value) {
  return sanitizeHtml(String(value ?? ""), {
    allowedTags,
    allowedAttributes: {
      "*": ["class", "dir", "id", "lang"],
      a: ["href", "rel", "target", "title"],
      img: ["alt", "decoding", "height", "loading", "src", "title", "width"],
      iframe: ["allow", "allowfullscreen", "frameborder", "height", "loading", "referrerpolicy", "src", "title", "width"],
      pre: ["class", "data-language", "style"],
      code: ["class", "style"],
      span: ["class", "style"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowedIframeHostnames: ["www.youtube.com"],
    allowedStyles: {
      pre: {
        "background-color": [/^#[0-9a-f]{3,8}$/i],
        color: [/^#[0-9a-f]{3,8}$/i],
      },
      code: { color: [/^#[0-9a-f]{3,8}$/i] },
      span: { color: [/^#[0-9a-f]{3,8}$/i] },
    },
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
  });
}

export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

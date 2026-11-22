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

// This fixed, reviewed asset is inserted after sanitization; localized content
// cannot supply media URLs, attributes, or arbitrary HTML via this marker.
export function insertReviewedArticleMedia(html, slug) {
  if (slug !== "13-quick-qlab-subtitles-from-excel-txt") return html;
  const marker = "<p>[[pockitle-station-qlab-demo]]</p>";
  const video = '<video controls muted loop playsinline preload="metadata" width="1600" height="696" poster="https://surtitlelive.com/images/qlab/station-drag-to-qlab-poster.jpg" style="width:100%;height:auto" aria-label="Pockitle Cue Station + QLab"><source src="https://surtitlelive.com/images/qlab/station-drag-to-qlab.webm" type="video/webm"><source src="https://surtitlelive.com/images/qlab/station-drag-to-qlab.mp4" type="video/mp4"><a href="https://surtitlelive.com/images/qlab/station-drag-to-qlab.webm">Video</a></video>';
  return String(html).replace(marker, video);
}

export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

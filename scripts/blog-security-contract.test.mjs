import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizeLocalizedBlogHtml,
  serializeJsonLd,
} from "../src/lib/blogSecurity.mjs";

test("provider HTML is inert while reviewed article structure is preserved", () => {
  const sanitized = sanitizeLocalizedBlogHtml([
    '<h2 id="safe">Heading</h2>',
    '<img src="https://surtitlelive.com/image.png" onerror="alert(1)">',
    '<a href="javascript:alert(2)">unsafe</a>',
    '<pre class="mermaid">graph TD; A--&gt;B</pre>',
    '<iframe src="https://www.youtube.com/embed/reviewed" title="Reviewed video"></iframe>',
    '<iframe src="https://evil.example/embed/phishing"></iframe>',
    '<script>globalThis.compromised = true</script>',
  ].join(""));

  assert.match(sanitized, /<h2 id="safe">Heading<\/h2>/);
  assert.match(sanitized, /<pre class="mermaid">/);
  assert.match(sanitized, /https:\/\/www\.youtube\.com\/embed\/reviewed/);
  assert.doesNotMatch(sanitized, /evil\.example/);
  assert.doesNotMatch(sanitized, /onerror|javascript:|<script/i);
});

test("JSON-LD cannot terminate its script element", () => {
  const serialized = serializeJsonLd({
    title: '</script><script>globalThis.compromised = true</script>',
    separator: "\u2028\u2029",
  });

  assert.doesNotMatch(serialized, /<|>|&|\u2028|\u2029/u);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u2028\\u2029/);
});

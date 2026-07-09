import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export function getShikiHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: ["applescript", "javascript", "typescript", "json", "html", "css", "bash", "mermaid"]
    });
  }
  return highlighterPromise;
}

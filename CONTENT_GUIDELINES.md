# SurtitleLive Blog - Content & Design Guidelines

This document serves as an internal reference for maintaining the style, tone, and visual consistency of the SurtitleLive blog (`blog.surtitlelive.com`).

---

## 1. Writing Style & Tone

Our voice is **Professional, Direct, and Empathetic to Theatre Techs**.

*   **Audience**: Theatre technicians, Stage Managers, captioners, and producers. They value reliability and efficiency over fluff.
*   **Tone**:
    *   **Confident**: We know the industry constraints.
    *   **Direct**: Get to the point. Avoid flowery marketing language.
    *   **Problem-Focused**: Start with the pain point (e.g., "Spacebar Panic") and offer the solution.
*   **Key Terminology**:
    *   Use "SurtitleLive Cockpit" (not just "dashboard").
    *   Use "Surtitles" or "Superstitles" (depending on context, but be consistent).
    *   "Non-linear" is a key differentiator.

**Example Structure (PAS Framework):**
1.  **Problem**: Identify a specific frustration (e.g., PowerPoint crashing, skipping lines).
2.  **Agitation**: Describe the consequence (panic, audience distraction).
3.  **Solution**: Explain how SurtitleLive fixes it (Cloud-based, AI ingestion).

---

## 2. Formatting Standards

We use a **Minimalist, Text-First** layout to differentiate from generic "lifestyle" blogs.

### Typography
*   **Font**: `Arial, Helvetica, sans-serif` (System fonts first).
*   **Headers**: Left-aligned, Bold (700/800 weight).
    *   `#` (H1): Article Title (Automated by layout).
    *   `##` (H2): Major sections.
    *   `###` (H3): Sub-points.
*   **Emphasis**: Use **Bold** for key concepts or "aha" moments. Avoid excessive italics.
*   **Links**: Links within text (`.prose a`) are automatically **underlined** and colored Gold/Dark Yellow (`#b89133`) to strictly indicate clickability.

### Layout Rules
*   **No Hero Images**: We intentionally removed top-banner images to maintain a clean, SaaS-like aesthetic.
*   **Container Width**: Articles are centered in a `860px` container for optimal readability.
*   **Alignment**: All major text elements are **Left-Aligned**.

---

## 3. Technical Workflow

### Creating a New Post
1.  Create a `.md` file in `src/content/blog/`.
2.  Filename should be slug-friendly (e.g., `modern-theatre-tech.md`).

### Frontmatter Template
```yaml
---
title: 'The Future of BYOD Surtitling'
description: 'Why sending subtitles to user phones is the next big accessibility leap.'
pubDate: '2025-12-31'
# heroImage: Leave empty or omit unless specifically required (layout hides it by default)
tags: ['Accessibility', 'BYOD', 'Tech']
---
```

### GitHub & Deployment
*   **Push to Deploy**: Any push to the `main` branch triggers a Cloudflare Pages build.
*   **Assets**: Place logic-related images in `src/assets/`. Reference them via relative paths (e.g., `../../assets/image.jpg`).
*   **Verification**: Always check `blog.surtitlelive.com` ~2 minutes after pushing.

---

## 4. Visual Identity (CSS)

*   **Background**: White (`#ffffff`).
*   **Text**: Dark Gray/Black (`#171717`).
*   **Brand Accent**: Gold (`#E0B44A` / `#b89133`).
*   **Footer**: Black background, simple text links (matching main site).

*Note: Styles are defined in `src/styles/global.css`.*

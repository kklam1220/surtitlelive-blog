# SurtitleLive Blog Deployment Guide

## Architecture Overview

The blog is managed in a **Dual-Repository Setup**:

1.  **Development Location**: `SurtitleLive_v2/blog` (Local)
    - This is where you write content and edit code alongside the main application.
    - It is part of the main `SurtitleLive_v2` monorepo storage.

2.  **Deployment Repository**: `kklam1220/surtitlelive-blog` (Remote)
    - This is a dedicated repository connected to **Cloudflare Pages**.
    - Pushing to this repository triggers the live site build.
    - Live URL: [https://blog.surtitlelive.com](https://blog.surtitlelive.com)

### Routing Contract

The Cloudflare Pages project serves the Astro build from its root output (`/`, `/:slug`, `/_astro/*`).
At the same time, the public SurtitleLive blog contract remains `/blog/*`:

- canonical URLs: `https://surtitlelive.com/blog/...`
- dedicated-origin render URLs: `https://blog.surtitlelive.com/:slug` and `https://blog.surtitlelive.com/:locale/:slug`
- custom-domain compatibility URLs for HTML under `https://blog.surtitlelive.com/blog/...` redirect to the apex canonical URLs

This only works because the deployment output must include [\_redirects](./public/_redirects), which keeps assets/feed compatibility rewrites and canonicalizes duplicate HTML paths:

- `/blog/` -> `https://surtitlelive.com/blog/` (301)
- `/blog/:slug` -> `https://surtitlelive.com/blog/:slug/` (301)
- `/blog/:locale/:slug` -> `https://surtitlelive.com/blog/:locale/:slug/` (301)
- `/blog/_astro/*` -> `/_astro/*`
- `/blog/fonts/*` -> `/blog/fonts/*`
- `/blog/logo/*` -> `/blog/logo/*`
- `/blog/rss.xml` / `/blog/sitemap-*.xml` -> root feed/sitemap outputs

The deployment output must also include [\_headers](./public/_headers), which adds `X-Robots-Tag: noindex, follow` to direct blog-origin HTML responses. Redirects remain the preferred consolidation signal for `/blog/*`, but the header prevents accidental indexing if a stale Pages deployment or CDN rule serves duplicate compatibility HTML instead of redirecting. The root-output direct origin (`https://blog.surtitlelive.com/:slug`) cannot be redirected by Pages because the apex Worker fetches that path to serve the canonical `https://surtitlelive.com/blog/:slug/` URL. The Worker must therefore remove `X-Robots-Tag` from proxied apex `/blog/*` responses while leaving the direct blog-origin response noindexed.

If `_redirects` or `_headers` is missing or stale, the custom domain can start returning homepage HTML for article/image URLs, expose duplicate `/blog/*` HTML on the dedicated origin, or weaken crawler consolidation on the apex canonical.

The static build also owns a real [`404.astro`](./src/pages/404.astro) document. Cloudflare Pages must serve that document with an HTTP `404` for unknown article paths; it must never rewrite an unknown path to the blog homepage with `200`, because that creates a soft-404 and weakens crawl signals.

On the edge side, `scripts/cloudflare/surtitlelive-proxy.worker.js` is the primary apex `/blog/*` handoff layer. It must rewrite canonical `https://surtitlelive.com/blog/...` requests onto the dedicated Astro origin's real root-output paths and strip the direct-origin `X-Robots-Tag` before returning the apex response. `web/next.config.ts` `beforeFiles` rewrites remain as a secondary compatibility layer only and must also target root-output origin paths for HTML.

---

## How to Deploy Changes

Since the local `blog` folder is part of the main repo but deployment happens from the separate `surtitlelive-blog` repo, you must **sync** your changes.

### Option A: The Automated Sync Script (Recommended)

Use the repository script from the project root:

```powershell
pwsh -File .\scripts\deploy\deploy-blog.ps1
```

The script now runs the local preflight first:

- `npm --prefix blog run blog:i18n:check`
- `npm --prefix blog run build`
- `npm --prefix blog run build:check`

and aborts before syncing if localization readiness or the Pages route contract is broken.

If you need to do the same steps manually, the equivalent flow is:

```powershell
# 1. Clone the deployment repo to a temporary folder
git clone https://github.com/kklam1220/surtitlelive-blog.git temp_blog_deploy

# 2. Copy all content from your local blog folder to the temp folder
Copy-Item -Path ".\blog\*" -Destination ".\temp_blog_deploy" -Recurse -Force

# 3. Commit and Push
cd temp_blog_deploy
git add .
git commit -m "Deploy: Sync content from main repo"
git push origin main

# 4. Cleanup
cd ..
Remove-Item -Path ".\temp_blog_deploy" -Recurse -Force
```

### Option B: Manual Git Remote Setup (Advanced)

If you prefer to work directly from the `blog` folder, ensure you exclude build artifacts and sensitive configs manually. We strongly recommend Option A.

---

## 🔍 Content & SEO Audit (Pre-push)

Before running the sync script, verify the "AEO-Readiness" of your markdown:

1.  **YAML Frontmatter**: Ensure `title` and `description` contain core keywords (e.g., Theatre Subtitles, BYOD).
2.  **Internal Links**: Use absolute paths for main site links (e.g., `https://surtitlelive.com/cockpit`) to prevent broken links in RSS/Aggregation.
3.  **Structure**: Check that H2 (`##`) and H3 (`###`) follow a logical hierarchy. This helps AI models extract structured summaries.
4.  **Social Preview (OG Image)**: Check if `heroImage` is present. This is what appears on LinkedIn/Twitter.
5.  **Slug Health**: Ensure the filename is URL-friendly (e.g., `beyond-the-led-screen.md`).
6.  **Canonical Main-Site Links**: Use the apex host `https://surtitlelive.com/...` for all links back into the main product. Do not point blog CTAs or legal links at `https://www.surtitlelive.com/...`.

## 🖼️ Image Handling Guidelines

To ensure images load correctly in production:

1.  **Naming Convention**: **NO SPACES**. Use dashes.
    - ✅ Correct: `theatre-gallery-byod.jpg`
    - ❌ Incorrect: `theatre gallery byod.jpg` (Cloudflare Pages may fail to resolve this)
2.  **Format**: Use `.jpg`, `.png`, or `.webp`.
3.  **Location**: Store images in `src/content/blog/` alongside the markdown file.
4.  **Usage in Markdown**:
    ```markdown
    heroImage: './my-image.jpg'
    ```
5.  **Usage in Astro Layouts**:
    ALWAYS use the Astro `<Image />` component, not `<img>`.
    ```astro
    import { Image } from 'astro:assets';
    <Image src={heroImage} alt="SurtitleLive mobile subtitle interface featuring OLED dark mode..." />
    ```
    - **Alt Text**: Mandatory for SEO. Describe the image context richly for Google Image Search.
    - _Standard `<img>` tags will fail to resolve relative paths in production builds._

## 🛠️ Sync Script & Asset Tips

- **Drafts**: If you have unfinished posts, create a `drafts` folder inside `content/` and ensure your sync script excludes it, or use `draft: true` in frontmatter (if configured in content collection).
- **Static Assets**: Ensure your `.gitignore` in the blog folder does NOT ignore `.jpg` or `.webp` files, otherwise they won't be synced to the deployment repo.
- **Base-Aware Fonts/Assets**: This Astro app is deployed with `base: '/blog/'`. Font preloads and `@font-face` rules are emitted from `src/components/BaseHead.astro` and must resolve to `/blog/fonts/...` exactly once in the built output. Never ship `/blog/blog/fonts/...`, bare `/fonts/...`, or unresolved template placeholders.
- **Canonical Logo**: Shared chrome should use the canonical main-site logo asset. `src/components/Header.astro` must point at `https://surtitlelive.com/logo/New_logo.png`, not `/blog/logo/New_logo.png`, so the visible header does not depend on the blog-origin compatibility rewrite layer.
- **Header Locale Contract**: The blog header owns its own Astro-native locale selector. It must stay aligned with the same 18 supported locales as the main site, but it must not depend on the main site's Next.js locale router because the blog deployment remains independently hosted on Cloudflare Pages.
- **Pages Rewrite Contract**: Do not remove `public/_redirects`. The blog build is static-root output, but the custom domain still has to honor `/blog/*` for compatibility and SEO handoff.
- **Pages Indexing Guard**: Do not remove `public/_headers`. It keeps direct blog-origin `/blog/*` compatibility responses out of the index if a redirect is bypassed, while leaving canonical apex `/blog/*` responses unaffected.

---

## Verifying Deployment

1.  Go to **Cloudflare Pages Dashboard**.
2.  Check the `surtitlelive-blog` project.
3.  Wait for the "Success" status (approx. 2 minutes).
4.  Visit [https://blog.surtitlelive.com](https://blog.surtitlelive.com).
5.  Run the local build contract check before pushing:
    ```bash
    npm run build
    npm run build:check
    ```
    The check will fail if:
    - the built blog still emits `/blog/blog/fonts/...` URLs
    - the built CSS still contains root-only `/fonts/...` references
    - the built HTML still contains deprecated `https://www.surtitlelive.com` links
    - the built HTML still references `/logo/New_logo.png`
    - the built output is missing the required Cloudflare Pages `_redirects` contract
    - the built output is missing the noindex blog `404.html` document
    - a hero-image article page still emits placeholder `og:image` / `twitter:image` metadata
6.  If production still shows `Failed to decode downloaded font` after a deploy, probe the live asset directly:
    ```bash
    curl -I https://blog.surtitlelive.com/blog/fonts/atkinson-regular.woff
    curl -I https://blog.surtitlelive.com/blog/blog/fonts/atkinson-regular.woff
    ```
    Expected result:
    - `/blog/fonts/...` returns `200` with `Content-Type: font/woff`
    - `/blog/blog/fonts/...` must not be referenced by the HTML/CSS. If it returns `text/html`, you are still seeing a stale deploy or a cached old document, not a valid font file.
7.  If article URLs or `_astro` images under `https://blog.surtitlelive.com/blog/...` return the homepage or expose duplicate article HTML, inspect the deployed `_redirects` contract first. The usual probes are:
    ```bash
    curl -I https://blog.surtitlelive.com/blog/7-geometry-of-dramatic-parsing/
    curl -I https://blog.surtitlelive.com/blog/_astro/<asset>.webp
    curl -I https://blog.surtitlelive.com/blog/rss.xml
    ```
    Expected result:
    - article paths return `301` to the apex canonical article URL
    - `_astro` assets return `image/*`, not `text/html`
    - `/blog/rss.xml` and `/blog/sitemap-index.xml` resolve through `_redirects` to the root feed/sitemap
8.  If `https://surtitlelive.com/blog/<slug>/` returns the main-site 404 while the dedicated blog origin still works, inspect the web tier handoff first:
    ```bash
    curl -I https://surtitlelive.com/blog/7-geometry-of-dramatic-parsing/
    ```
    Expected result:
    - the canonical apex article returns article HTML from the dedicated Astro origin
    - it must not fall through to the Next.js main-site 404 page
    - current SSOT owner for that handoff is `web/src/proxy.ts`, not App Router fallback pages
9.  If a canonical apex blog card image is missing but the same asset still works on `https://blog.surtitlelive.com/_astro/...`, treat it as an edge-cache mismatch first, not a browser-cache problem:
    ```bash
    curl -I https://surtitlelive.com/blog/_astro/<asset>.webp
    curl -I https://blog.surtitlelive.com/_astro/<asset>.webp
    ```
    Expected result:
    - both hosts return the same `image/*` content type
    - if `surtitlelive.com` returns `text/html` while `blog.surtitlelive.com` returns `image/*`, the apex edge has cached the wrong object
    - preferred fix: targeted Cloudflare purge for the exact apex asset URL
    - fallback when ops write-token access is unavailable: change the affected Astro image transform so the card emits a new asset URL, then do a blog-only Pages deploy
10. Probe one deliberately unknown article path after deployment. Both the dedicated origin and canonical apex proxy must return HTTP `404` with the noindex Page Not Found document, never the blog homepage with `200`.

# SurtitleLive Blog

Official blog for [SurtitleLive](https://surtitlelive.com) - Live subtitling platform for theatre and events.

Built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## URL Model

This project has two simultaneous URL concerns:

- **Deployment origin**: Cloudflare Pages serves the Astro build from the project root on `blog.surtitlelive.com`
- **Public blog contract**: SurtitleLive still uses `/blog/*` as the canonical path family

That means the published build must carry `public/_redirects` so the custom domain can correctly resolve:

- root-output render paths such as `/`, `/<slug>/`, and `/<locale>/<slug>/`
- duplicate HTML compatibility paths such as `/blog/`, `/blog/<slug>/`, and `/blog/<locale>/<slug>/` as 301 redirects to the apex canonical URLs
- compatibility assets and feeds such as `/blog/_astro/*`, `/blog/fonts/*`, `/blog/rss.xml`, and `/blog/<locale>/rss.xml`

Without that Pages redirect layer, the custom domain can return homepage HTML for asset URLs under `/blog/*` or expose duplicate article HTML on the dedicated origin.

## 🚀 Quick Start

### Development

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) to view the blog locally.

### Build

```bash
npm run build
npm run build:check
```

The static site will be generated in the `dist/` directory.

### Preview

```bash
npm run preview
```

Preview the production build locally.

## 📝 Creating Blog Posts

Blog posts are Markdown files located in `src/content/blog/`.
Files whose names start with `_` are local drafts. Astro and the blog
localization scripts ignore them, so rename the file before treating it as a
published post.

### Create a New Post

1. Create a new `.md` file in `src/content/blog/`
2. Add frontmatter with metadata:

```markdown
---
title: 'Your Post Title'
description: 'A brief description for SEO'
pubDate: '2025-01-01'
heroImage: '../../assets/your-image.jpg'
---

Your blog content here...
```

3. Write your content using Markdown
4. Commit and push to GitHub

### Frontmatter Fields

- **title**: Post title (required)
- **description**: Short description for SEO and previews (required)
- **pubDate**: Publication date in YYYY-MM-DD format (required)
- **heroImage**: Optional hero image path
- **updatedDate**: Optional update date

## 🌍 Blog Localization Workflow (LLM)

English posts in `src/content/blog/*.md` and `*.mdx` are the only source of truth.

```bash
npm run blog:i18n:sync
npm run blog:i18n:translate:llm
npm run blog:i18n:check
npm run blog:i18n:geo
```

Output locale payloads are written to `src/content/i18n/blog/<locale>/<slug>.json` with `sourceHash` for drift detection.
AI answer blocks (key takeaways / FAQ / glossary) are written to `src/content/i18n/geo/<locale>/<slug>.json`.
Article pages suppress the generated GEO block when the authored Markdown already contains an equivalent `FAQ`, `Key Takeaways`, or `Glossary` heading. Authored editorial sections take precedence over generated enrichment so readers do not see duplicate FAQ or summary sections.
Slug-scoped syncs such as `node scripts/sync-blog-locales.cjs --slugs=<slug>` from the `blog/` directory only create or update that slug's locale payloads; pruning stale locale payloads happens only during a full sync.
`blog:i18n:translate:llm` defaults to Gemini, but it can run Alibaba Cloud Model Studio / DashScope DeepSeek through the OpenAI-compatible endpoint. For native-quality review passes on selected locales, set `BLOG_TRANSLATION_PROVIDER=dashscope-deepseek`, `DASHSCOPE_API_KEY`, `DASHSCOPE_DEEPSEEK_BLOG_MODEL=deepseek-v4-pro`, and `BLOG_TRANSLATION_ENABLE_THINKING=true`, or pass `--provider=dashscope-deepseek --model=deepseek-v4-pro --thinking`.

One-command flow:

```bash
npm run blog:i18n:refresh
```

Published localized routes:
- `/blog/<locale>/` (index)
- `/blog/<locale>/<slug>/` (article)
- `/blog/<locale>/rss.xml` (localized feed)

The blog now exposes a built-in language selector in `src/components/Header.astro`. It is intentionally Astro-native and independent from the main site's Next.js locale router, but it must stay aligned with the same 18 supported locales so users can switch language directly inside the blog without leaving the independent Pages deployment path.

Indexing is intentionally narrower than reachability. The tier-1 indexed blog locales are English, German, Spanish, French, Japanese, Korean, and Traditional Chinese; other localized blog pages remain reachable but render `noindex,follow` and are excluded from the Astro sitemap unless a slug is explicitly allowlisted. Current all-locale indexed exception: `9-english-surtitles-non-english-show-fringe`.

## 🎨 Adding Images

Place images in `src/assets/` and reference them in frontmatter:

```markdown
heroImage: '../../assets/my-image.jpg'
```

Or use them inline:

```markdown
![Alt text](../../assets/my-image.jpg)
```

## 🌐 Deployment

### Cloudflare Pages Setup

This blog is automatically deployed to Cloudflare Pages when you push to GitHub.

#### Initial Setup

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/surtitlelive-blog.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your repository: `surtitlelive-blog`
   - Configure build settings:
     - **Framework preset**: Astro
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Node version**: 18 or later (set in Environment Variables)

3. **Add Custom Domain**
   - In project settings → Custom domains
   - Add: `blog.surtitlelive.com`
   - Cloudflare will automatically configure DNS and SSL

#### Automatic Deployments

Every git push to `main` triggers a new deployment:

```bash
git add .
git commit -m "Add new blog post"
git push
```

Cloudflare Pages will:
- Build your site (typically < 1 minute)
- Deploy to global CDN
- Make it live at `blog.surtitlelive.com`

#### Required Pages Files

The deployment output must include:

- `public/_redirects`
- `public/blog/fonts/*`
- `public/blog/logo/New_logo.png`

These are not optional niceties. They are part of the runtime contract that keeps blog-origin assets compatible and blog-origin duplicate HTML canonicalized while the Astro build itself remains root-output static files.

#### Preview Deployments

Pull requests automatically get preview URLs for review before merging.

## 📦 Project Structure

```
/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images and media
│   ├── components/     # Astro components
│   ├── content/
│   │   └── blog/       # Blog posts (Markdown)
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes
│   │   ├── index.astro # Blog homepage
│   │   ├── [...slug].astro
│   │   ├── [locale]/index.astro
│   │   ├── [locale]/[slug].astro
│   │   ├── [locale]/rss.xml.js
│   │   └── rss.xml.js  # RSS feed (English)
│   ├── styles/         # Global styles
│   └── consts.ts       # Site configuration
├── astro.config.mjs    # Astro configuration
└── package.json
```

## ⚙️ Configuration

Edit site metadata in `src/consts.ts`:

```typescript
export const SITE_TITLE = 'SurtitleLive Blog';
export const SITE_DESCRIPTION = 'News, tutorials, and insights...';
```

Edit site URL in `astro.config.mjs`:

```javascript
export default defineConfig({
  site: 'https://surtitlelive.com',
  base: '/blog/',
  // ...
});
```

Keep `base: '/blog/'` unless you are intentionally redesigning the entire main-site/blog routing model. The current production setup depends on `/blog/*` links in generated HTML plus Cloudflare Pages `_redirects` to keep assets/feed URLs compatible and to redirect duplicate origin HTML back to the apex canonical blog URLs.

## 🔗 Integration with Main App

The main SurtitleLive application exposes this blog canonically at `https://surtitlelive.com/blog/`.

This blog links back to the main app using the canonical apex host `https://surtitlelive.com`, not `https://www.surtitlelive.com`.

The main app keeps `/blog/*` canonical on the apex host through `web/src/proxy.ts`, which rewrites canonical `/blog/*` requests directly onto the dedicated blog origin's root-output paths before App Router routing runs. `web/next.config.ts` retains a secondary compatibility rewrite, but it is no longer the primary runtime guarantee. The Astro app itself must therefore preserve these distinct surfaces:

- canonical public URLs under `https://surtitlelive.com/blog/*`
- dedicated-origin render URLs under `https://blog.surtitlelive.com/*`
- dedicated-origin `/blog/*` compatibility URLs that either 301 to the apex canonical HTML URL or 200-rewrite asset/feed/sitemap files

The dedicated Cloudflare Pages compatibility layer is explicitly owned by `public/_redirects`. That file must keep bridge rules for:

- `/blog/_astro/*` -> `/_astro/*`
- `/blog/fonts/*` -> `/blog/fonts/*`
- `/blog/logo/*` -> `/blog/logo/*`
- `/blog/:slug` and `/blog/:locale/:slug` -> apex canonical article paths with 301 redirects

Shared chrome must use canonical main-site assets when possible. `src/components/Header.astro` points the logo at `https://surtitlelive.com/logo/New_logo.png` so the visible header does not depend on blog-origin `/blog/logo/*` compatibility rewrites.

Compatibility-only App Router blog pages still exist under `web/src/app/blog/...` and `web/src/app/[locale]/blog/...`, but they are fallback redirects only. Production fallbacks must hand off to the dedicated blog origin's root-output paths while preserving locale and slug.

## ✅ Build Contract Checks

After every production build, run:

```bash
npm run build
npm run build:check
```

`build:check` fails fast if:
- a font URL is double-prefixed as `/blog/blog/fonts/...`
- the built CSS still contains bare `/fonts/...` URLs
- the built HTML still contains deprecated `https://www.surtitlelive.com` links
- the built HTML still contains `/logo/New_logo.png`
- the built output is missing the required Cloudflare Pages `_redirects` rules
- a hero-image article page still emits placeholder `og:image` / `twitter:image` metadata instead of the article image

## 📄 License

Copyright © 2025 SurtitleLive
 

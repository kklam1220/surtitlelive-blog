# SurtitleLive Blog

Official blog for [SurtitleLive](https://surtitlelive.com) - Live subtitling platform for theatre and events.

Built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## URL Model

This project has two simultaneous URL concerns:

- **Deployment origin**: Cloudflare Pages serves the Astro build from the project root on `blog.surtitlelive.com`
- **Public blog contract**: SurtitleLive still uses `/blog/*` as the canonical path family

That means the published build must carry `public/_redirects` so the custom domain can correctly resolve:

- `/blog/` -> `/`
- `/blog/<slug>/` -> `/<slug>/`
- `/blog/<locale>/<slug>/` -> `/<locale>/<slug>/`
- `/blog/_astro/*` -> `/_astro/*`

Without that Pages rewrite layer, the custom domain returns the homepage HTML for article and image URLs under `/blog/*`.

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

## 🌍 Blog Localization Workflow (Gemini)

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

One-command flow:

```bash
npm run blog:i18n:refresh
```

Published localized routes:
- `/blog/<locale>/` (index)
- `/blog/<locale>/<slug>/` (article)
- `/blog/<locale>/rss.xml` (localized feed)

The blog now exposes a built-in language selector in `src/components/Header.astro`. It is intentionally Astro-native and independent from the main site's Next.js locale router, but it must stay aligned with the same 18 supported locales so users can switch language directly inside the blog without leaving the independent Pages deployment path.

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

These are not optional niceties. They are part of the runtime contract that keeps `blog.surtitlelive.com/blog/*` working while the Astro build itself remains root-output static files.

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

Keep `base: '/blog/'` unless you are intentionally redesigning the entire main-site/blog routing model. The current production setup depends on `/blog/*` links in generated HTML plus Cloudflare Pages `_redirects` to bridge those URLs back to the root-output build.

## 🔗 Integration with Main App

The main SurtitleLive application links to this blog at `https://blog.surtitlelive.com`.

This blog links back to the main app using the canonical apex host `https://surtitlelive.com`, not `https://www.surtitlelive.com`.

The main app keeps `/blog/*` canonical on the apex host through `web/src/proxy.ts`, which rewrites canonical `/blog/*` requests directly onto the dedicated blog origin's root-output paths before App Router routing runs. `web/next.config.ts` retains a secondary compatibility rewrite, but it is no longer the primary runtime guarantee. The Astro app itself must therefore remain compatible with both:

- `https://surtitlelive.com/blog/*`
- `https://blog.surtitlelive.com/blog/*`

The dedicated Cloudflare Pages compatibility layer is explicitly owned by `public/_redirects`. That file must keep bridge rules for:

- `/blog/_astro/*` -> `/_astro/*`
- `/blog/fonts/*` -> `/blog/fonts/*`
- `/blog/logo/*` -> `/blog/logo/*`
- `/blog/:slug` and `/blog/:locale/:slug` -> root-output article paths

Shared chrome assets should also be cache-busted when the compatibility contract changes. `src/components/Header.astro` now versions the logo URL from the latest `public/blog/logo/New_logo.png` and `public/_redirects` mtimes, so a Pages deploy that changes the compatibility layer does not keep serving a stale Cloudflare-cached logo.

Compatibility-only App Router blog pages still exist under `web/src/app/blog/...` and `web/src/app/[locale]/blog/...`, but they are fallback redirects only. Locale fallbacks must preserve both locale and slug when they hand off to the dedicated blog origin.

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
 

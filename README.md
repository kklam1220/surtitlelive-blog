# SurtitleLive Blog

Official blog for [SurtitleLive](https://surtitlelive.com) - Live subtitling platform for theatre and events.

Built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## 🚀 Quick Start

### Development

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) to view the blog locally.

### Build

```bash
npm run build
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
│   │   ├── blog/       # Blog post pages
│   │   └── rss.xml.ts  # RSS feed
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
  site: 'https://blog.surtitlelive.com',
  // ...
});
```

## 🔗 Integration with Main App

The main SurtitleLive application links to this blog at `https://blog.surtitlelive.com`.

This blog includes a link back to the main app in the navigation.

## 📄 License

Copyright © 2025 SurtitleLive
 

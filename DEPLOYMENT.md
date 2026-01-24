# SurtitleLive Blog Deployment Guide

## Architecture Overview

The blog is managed in a **Dual-Repository Setup**:

1.  **Development Location**: `SurtitleLive_v2/blog` (Local)
    *   This is where you write content and edit code alongside the main application.
    *   It is part of the main `SurtitleLive_v2` monorepo storage.

2.  **Deployment Repository**: `kklam1220/surtitlelive-blog` (Remote)
    *   This is a dedicated repository connected to **Cloudflare Pages**.
    *   Pushing to this repository triggers the live site build.
    *   Live URL: [https://blog.surtitlelive.com](https://blog.surtitlelive.com)

---

## How to Deploy Changes

Since the local `blog` folder is part of the main repo but deployment happens from the separate `surtitlelive-blog` repo, you must **sync** your changes.

### Option A: The Automated Sync Script (Recommended)

We recommend creating a script to automate this. Run the following PowerShell commands from the project root:

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

## 🖼️ Image Handling Guidelines

To ensure images load correctly in production:

1.  **Naming Convention**: **NO SPACES**. Use dashes.
    *   ✅ Correct: `theatre-gallery-byod.jpg`
    *   ❌ Incorrect: `theatre gallery byod.jpg` (Cloudflare Pages may fail to resolve this)
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
    *   **Alt Text**: Mandatory for SEO. Describe the image context richly for Google Image Search.
    *   *Standard `<img>` tags will fail to resolve relative paths in production builds.*

## 🛠️ Sync Script & Asset Tips

*   **Drafts**: If you have unfinished posts, create a `drafts` folder inside `content/` and ensure your sync script excludes it, or use `draft: true` in frontmatter (if configured in content collection).
*   **Static Assets**: Ensure your `.gitignore` in the blog folder does NOT ignore `.jpg` or `.webp` files, otherwise they won't be synced to the deployment repo.

---

## Verifying Deployment

1.  Go to **Cloudflare Pages Dashboard**.
2.  Check the `surtitlelive-blog` project.
3.  Wait for the "Success" status (approx. 2 minutes).
4.  Visit [https://blog.surtitlelive.com](https://blog.surtitlelive.com).

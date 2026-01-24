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

If you prefer to work directly from the `blog` folder:

1.  Open a terminal in `blog/`.
2.  Add the deployment remote (if not already added):
    ```bash
    git remote add deploy https://github.com/kklam1220/surtitlelive-blog.git
    ```
3.  When you want to deploy:
    ```bash
    git push deploy main
    ```
    *(Note: This requires the local git history to match the remote. If they diverge, Option A is safer.)*

---

## Verifying Deployment

1.  Go to **Cloudflare Pages Dashboard**.
2.  Check the `surtitlelive-blog` project.
3.  Wait for the "Success" status (approx. 2 minutes).
4.  Visit [https://blog.surtitlelive.com](https://blog.surtitlelive.com).

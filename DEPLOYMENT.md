# Cloudflare Pages Deployment Guide

Complete step-by-step guide to deploy the SurtitleLive blog to Cloudflare Pages.

## Prerequisites

- ✅ GitHub account
- ✅ Cloudflare account with access to `surtitlelive.com` domain
- ✅ Blog project ready to push (this repository)

## Step 1: Push to GitHub

### Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository:
   - **Repository name**: `surtitlelive-blog`
   - **Description**: "Official blog for SurtitleLive platform"
   - **Visibility**: Choose Public or Private
   - **Do NOT initialize with README** (we already have one)

### Push Local Repository

```bash
# Navigate to blog directory
cd c:\Users\MSI\Desktop\SurtitleLive_v2\blog

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/surtitlelive-blog.git

# Check status
git status

# Add all files (already staged by Astro init)
git add .

# Commit if there are new changes
git commit -m "Initial blog setup with SurtitleLive branding"

# Push to GitHub
git push -u origin main
```

If you encounter authentication issues, you may need to use a Personal Access Token:
- Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token with `repo` scope
- Use the token as your password when pushing

## Step 2: Connect to Cloudflare Pages

### Create New Pages Project

1. **Login to Cloudflare**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select your account

2. **Navigate to Pages**
   - In the left sidebar, click **Workers & Pages**
   - Click **Create application**
   - Choose **Pages** tab
   - Click **Connect to Git**

3. **Connect GitHub**
   - Click **Connect GitHub**
   - Authorize Cloudflare Pages to access your GitHub account
   - Select the repositories you want to grant access to:
     - Either grant access to all repositories
     - Or select only `surtitlelive-blog`

4. **Set up Build Configuration**
   - **Project name**: `surtitlelive-blog` (this will be your default URL)
   - **Production branch**: `main`
   - **Framework preset**: Select **Astro** from the dropdown
     - This auto-fills build settings:
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - **Root directory**: Leave empty (uses repository root)

5. **Environment Variables** (click "Add variable" if needed)
   - Add `NODE_VERSION` = `18` (or later)
   - This ensures Cloudflare uses compatible Node.js version

6. **Click "Save and Deploy"**

### Monitor First Deployment

- You'll be redirected to the deployment page
- Watch the build logs in real-time
- First deployment typically takes 2-3 minutes
- Once complete, you'll see a success message and preview URL

### View Your Blog

Your blog will be live at:
- **Cloudflare Pages URL**: `https://surtitlelive-blog.pages.dev`

Test this URL to ensure everything works before configuring custom domain.

## Step 3: Configure Custom Domain

### Add Custom Domain in Cloudflare Pages

1. **In your Pages project**, go to **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter: `blog.surtitlelive.com`
4. Click **Continue**

### DNS Configuration

Cloudflare will automatically:
- Create a CNAME record: `blog.surtitlelive.com` → `surtitlelive-blog.pages.dev`
- Provision SSL/TLS certificate (takes ~1 minute)

If it doesn't auto-configure, manually add DNS record:
1. Go to **DNS** → **Records** in Cloudflare Dashboard
2. Add record:
   - **Type**: CNAME
   - **Name**: `blog`
   - **Target**: `surtitlelive-blog.pages.dev`
   - **Proxy status**: Proxied (orange cloud)
   - **TTL**: Auto

### Verify Domain

1. Wait 1-2 minutes for DNS propagation
2. Visit `https://blog.surtitlelive.com`
3. Verify SSL certificate is active (padlock in browser)

## Step 4: Configure Automatic Deployments

Automatic deployments are already configured! Any push to `main` branch will trigger a new build.

### Test Automatic Deployment

1. Make a small change to a blog post
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push
   ```
3. Go to Cloudflare Pages → Deployments
4. You'll see a new deployment in progress
5. Once complete, changes are live!

### Preview Deployments

Pull requests automatically get preview URLs:
1. Create a new branch:
   ```bash
   git checkout -b new-post
   ```
2. Make changes and push:
   ```bash
   git push origin new-post
   ```
3. Create a Pull Request on GitHub
4. Cloudflare automatically creates a preview URL
5. Review changes before merging to `main`

## Step 5: Optimize Settings (Optional)

### Build Settings

In Cloudflare Pages → Settings → Builds & deployments:
- **Build watch paths**: Leave empty (watches all files)
- **Build cache**: Enabled (speeds up builds)
- **Deploy hooks**: Create webhook for manual deployments

### Redirects & Headers

Create `public/_redirects` file for custom redirects:
```
/old-path /new-path 301
```

Create `public/_headers` file for security headers:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

## Verification Checklist

- [ ] GitHub repository created and pushed
- [ ] Cloudflare Pages project created
- [ ] First deployment successful
- [ ] Blog loads at `*.pages.dev` URL
- [ ] Custom domain `blog.surtitlelive.com` configured
- [ ] DNS CNAME record active
- [ ] SSL certificate provisioned
- [ ] Blog loads at custom domain with HTTPS
- [ ] Automatic deployments working (test with a push)
- [ ] RSS feed accessible at `/rss.xml`

## Troubleshooting

### Build Fails

**Check Node Version**:
- Add environment variable: `NODE_VERSION=18`

**Check Build Logs**:
- Look for dependency errors
- Ensure `package-lock.json` is committed

### Custom Domain Not Working

**DNS Propagation**:
- Wait 5-10 minutes for DNS changes
- Use `nslookup blog.surtitlelive.com` to verify

**SSL Certificate**:
- Should auto-provision in 1-2 minutes
- Check Cloudflare Pages → Custom domains for status

### Images Not Loading

**Ensure images are in correct location**:
- Place images in `src/assets/` directory
- Reference with relative paths: `../../assets/image.jpg`

## Daily Workflow: Publishing New Posts

1. **Create post** in `src/content/blog/new-post.md`
2. **Add frontmatter** (title, description, pubDate)
3. **Write content** in Markdown
4. **Preview locally**: `npm run dev`
5. **Commit**: `git add . && git commit -m "Add new post"`
6. **Push**: `git push`
7. **Wait ~1 minute** for automatic deployment
8. **Verify** at `blog.surtitlelive.com`

## Support

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Docs](https://docs.astro.build)
- [GitHub Support](https://support.github.com)

---

**Last Updated**: 2025-01-01

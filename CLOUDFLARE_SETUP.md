# Cloudflare Pages 快速設置指南

您的博客代碼已成功推送到 GitHub！現在只需要連接到 Cloudflare Pages 即可完成部署。

## 📦 GitHub 倉庫信息

- **倉庫 URL**: https://github.com/kklam1220/surtitlelive-blog
- **狀態**: ✅ 代碼已推送（62 個對象）
- **分支**: `main`

---

## 🚀 Cloudflare Pages 設置步驟

### 第 1 步：打開 Cloudflare Dashboard

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇您的帳號
3. 在左側菜單中，點擊 **Workers & Pages**
4. 點擊 **Create application** 按鈕
5. 選擇 **Pages** 標籤
6. 點擊 **Connect to Git**

### 第 2 步：連接 GitHub

1. 點擊 **Connect GitHub**
2. 如果這是第一次連接：
   - GitHub 會要求授權 Cloudflare Pages
   - 選擇授權存取權限（可以選擇所有倉庫或僅選擇特定倉庫）
3. 授權完成後，您會看到倉庫列表
4. 選擇 **kklam1220/surtitlelive-blog**

### 第 3 步：配置構建設置

填寫以下信息：

| 設置項 | 值 |
|--------|-----|
| **Project name** | `surtitlelive-blog` |
| **Production branch** | `main` |
| **Framework preset** | 選擇 **Astro** |
| **Build command** | `npm run build` （自動填入）|
| **Build output directory** | `dist` （自動填入）|
| **Root directory** | 留空 |

重要：
- 這個 Pages 專案必須保留 `public/_redirects`
- 它負責把 `blog.surtitlelive.com/blog/*` 代理回 Astro 實際輸出的 root 路徑，並明確保留 `/blog/fonts/*`、`/blog/logo/*` 這些 public compatibility asset
- 如果缺少這個檔案，文章頁和圖片會在 `/blog/*` 下回首頁 HTML
- 它只修復 dedicated blog origin。`https://surtitlelive.com/blog/*` 的 canonical 入口現在由主站 `web/src/proxy.ts` 在最前面 handoff 到 blog origin 的 root-output 路徑；`web/next.config.ts` 的 `beforeFiles` rewrite 只是次級兼容層，不是主要保證

#### 環境變數（可選）

點擊 **Add variable** 添加：
- **變數名**: `NODE_VERSION`
- **值**: `18`

這確保 Cloudflare 使用兼容的 Node.js 版本。

### 第 4 步：部署

1. 點擊 **Save and Deploy** 按鈕
2. Cloudflare 會開始構建您的網站
3. 您可以實時查看構建日誌
4. 首次部署通常需要 2-3 分鐘

### 第 5 步：驗證部署

部署完成後：
1. 您會看到一個預覽 URL，類似：`https://surtitlelive-blog.pages.dev`
2. 點擊該 URL 測試您的博客
3. 確認所有頁面正常加載

---

## 🌐 配置自定義域名

### 添加自定義域名

1. 在您的 Pages 項目中，前往 **Custom domains** 標籤
2. 點擊 **Set up a custom domain**
3. 輸入：`blog.surtitlelive.com`
4. 點擊 **Continue**

### DNS 配置

Cloudflare 會自動處理：
- ✅ 創建 CNAME 記錄：`blog` → `surtitlelive-blog.pages.dev`
- ✅ 配置 SSL/TLS 證書（約 1-2 分鐘）
- ✅ 啟用 CDN 加速

### 驗證自定義域名

1. 等待 1-2 分鐘讓 DNS 傳播
2. 訪問 `https://blog.surtitlelive.com`
3. 確認網站加載且有 HTTPS（瀏覽器顯示鎖頭圖標）

---

## ✅ 驗證清單

完成以下檢查以確保一切正常：

- [ ] Cloudflare Pages 項目已創建
- [ ] 首次部署成功（查看構建日誌）
- [ ] 預覽 URL (`*.pages.dev`) 可以訪問
- [ ] 博客首頁正確顯示
- [ ] 可以查看個別博客文章
- [ ] `https://blog.surtitlelive.com/blog/` 可以顯示博客首頁
- [ ] `https://blog.surtitlelive.com/blog/<slug>/` 可以顯示文章，而不是回首頁
- [ ] `https://blog.surtitlelive.com/blog/_astro/...` 返回圖片而不是 HTML
- [ ] RSS feed 可訪問：`/rss.xml`
- [ ] Sitemap 可訪問：`/sitemap-index.xml`
- [ ] 自定義域名 `blog.surtitlelive.com` 已配置
- [ ] DNS CNAME 記錄已創建
- [ ] SSL 證書已啟用
- [ ] 自定義域名可以正常訪問

---

## 🔄 自動部署

好消息！現在已經設置好自動部署：

### 發布新博客文章的工作流程

1. **創建新文章**
   ```bash
   # 在 src/content/blog/ 創建新的 .md 文件
   code src/content/blog/my-new-post.md
   ```

2. **添加 Frontmatter**
   ```markdown
   ---
   title: '您的文章標題'
   description: '簡短描述'
   pubDate: '2025-01-01'
   heroImage: '../../assets/cover-image.jpg'
   ---
   
   您的文章內容...
   ```

3. **本地預覽**（可選）
   ```bash
   cd c:\Users\MSI\Desktop\SurtitleLive_v2\blog
   npm run dev
   # 在瀏覽器打開 http://localhost:4321
   ```

4. **提交並推送**
   ```bash
   git add .
   git commit -m "Add new blog post: 文章標題"
   git push
   ```

5. **自動部署**
   - Cloudflare Pages 會自動檢測到推送
   - 開始構建（約 30-60 秒）
   - 自動部署到生產環境
   - 新文章立即生效！

### 查看部署狀態

1. 前往 Cloudflare Dashboard → Pages → surtitlelive-blog
2. 點擊 **Deployments** 標籤
3. 查看最新部署的狀態和日誌

---

## 🔗 整合主應用

在主 SurtitleLive 應用中添加博客鏈接：

### 在導航欄添加博客鏈接

編輯主應用的導航組件（例如 `web/src/components/Header.tsx`）：

```tsx
<nav>
  <a href="/">首頁</a>
  <a href="/pricing">價格</a>
  <a href="https://blog.surtitlelive.com" 
     target="_blank" 
     rel="noopener noreferrer">
    博客
  </a>
  {/* 其他鏈接 */}
</nav>
```

### 在博客中添加返回主站鏈接

這已經在 Astro 模板中包含了，您可以在 `src/components/Header.astro` 中自定義。

---

## 📊 監控和分析（可選）

### Google Analytics

如果您想追蹤博客流量：

1. 編輯 `src/layouts/BaseHead.astro`
2. 添加 Google Analytics 代碼
3. 提交並推送（自動部署）

### Cloudflare Web Analytics

免費且注重隱私：

1. Cloudflare Dashboard → Analytics → Web Analytics
2. 添加新網站：`blog.surtitlelive.com`
3. 複製追蹤代碼
4. 添加到 `src/layouts/BaseHead.astro`

---

## 🛠️ 故障排除

### 構建失敗

**檢查 Node 版本**：
- 在 Cloudflare Pages → Settings → Environment variables
- 添加 `NODE_VERSION=18`

**檢查構建日誌**：
- 點擊失敗的部署查看詳細錯誤
- 常見問題：依賴項缺失、語法錯誤

### 自定義域名無法訪問

**DNS 傳播**：
- 等待 5-10 分鐘
- 使用 `nslookup blog.surtitlelive.com` 驗證

**SSL 證書**：
- 通常 1-2 分鐘自動配置
- 在 Cloudflare Pages → Custom domains 查看狀態

### 圖片無法加載

**確保圖片位置正確**：
- 圖片應放在 `src/assets/` 目錄
- 使用相對路徑引用：`../../assets/image.jpg`
- 提交時包含圖片文件

### `blog/` 路由點進文章卻回首頁

先檢查三件事：

1. `public/_redirects` 是否存在並已部署
2. `build:check` 是否通過
3. 是否誤把 shared asset 路徑寫成 root-only，例如 `/logo/New_logo.png`

快速驗證：

```bash
curl -I https://blog.surtitlelive.com/blog/7-geometry-of-dramatic-parsing/
curl -I https://blog.surtitlelive.com/blog/_astro/script-parsing-theatre-subtitles.DK_aUvkY_1nkP64.webp
```

預期：
- 文章 URL 應回文章頁 HTML
- `_astro` URL 應回 `image/*`

---

## 📚 資源鏈接

- **GitHub 倉庫**: https://github.com/kklam1220/surtitlelive-blog
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Astro 文檔**: https://docs.astro.build
- **Cloudflare Pages 文檔**: https://developers.cloudflare.com/pages/

---

## 🎉 下一步

完成 Cloudflare Pages 設置後，您的博客系統就完全準備好了！

功能特點：
- ✅ **零成本**：Cloudflare Pages 免費層
- ✅ **全球 CDN**：超快速度
- ✅ **自動部署**：推送即更新
- ✅ **HTTPS**：自動 SSL 證書
- ✅ **無需重新部署主應用**：獨立運作

開始撰寫您的第一篇博客文章吧！🚀

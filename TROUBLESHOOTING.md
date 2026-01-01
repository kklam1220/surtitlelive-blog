# 修復 Cloudflare Pages 部署錯誤

## 問題分析

✅ **構建成功**：Astro 成功生成了 9 個靜態頁面到 `dist/` 目錄
❌ **部署失敗**：Cloudflare Pages 錯誤地執行了 `npx wrangler deploy` 命令

錯誤信息：
```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

**根本原因**：Cloudflare Pages 的部署設置不正確。對於靜態網站（Astro），不需要 Wrangler 部署命令。

---

## 📋 修復步驟

### 方法一：修改項目設置（推薦）

1. **前往 Cloudflare Pages 項目設置**
   - 在 Cloudflare Dashboard 中
   - Workers & Pages → surtitlelive-blog
   - 點擊 **Settings** 標籤
   - 選擇 **Builds & deployments**

2. **修改構建配置**
   
   點擊 **Edit configuration** 或 **Configure Production deployments**
   
   確保設置如下：
   
   | 設置項 | 正確值 |
   |--------|--------|
   | **Framework preset** | `Astro` |
   | **Build command** | `npm run build` |
   | **Build output directory** | `dist` |
   | **Root directory** | 留空（或 `/`） |
   
   **重要**：確保沒有自定義的 "Deploy command" 或 "Publish directory"

3. **保存設置**
   - 點擊 **Save**

4. **重新部署**
   - 回到 **Deployments** 標籤
   - 點擊最新失敗的部署旁的 **⋯** 菜單
   - 選擇 **Retry deployment**

---

### 方法二：刪除並重新創建項目

如果修改設置不起作用，可以重新創建：

1. **刪除當前項目**
   - Settings → 滾動到底部
   - 點擊 **Delete project**
   - 確認刪除

2. **重新創建項目**
   - Workers & Pages → Create application → Pages → Connect to Git
   - 選擇 `kklam1220/surtitlelive-blog`
   - **Framework preset**：選擇 **Astro**
   - 其他設置會自動填入：
     - Build command: `npm run build`
     - Build output directory: `dist`
   - **不要**手動添加任何額外的部署命令
   - 點擊 **Save and Deploy**

---

## 🎯 正確的構建設置

對於 Astro 靜態站點，Cloudflare Pages 應該：

```yaml
Framework: Astro
Build command: npm run build
Build output directory: dist
Root directory: (empty)
Environment variables:
  NODE_VERSION: 18
```

**不應該有**：
- ❌ 自定義 Deploy command
- ❌ Wrangler 配置
- ❌ Workers 腳本

---

## ✅ 預期結果

修復後，部署日誌應該顯示：

```
✓ Build command completed
✓ Uploading... (9 pages)
✓ Deployment complete!
✓ Success! Your site is live at https://surtitlelive-blog.pages.dev
```

---

## 🔍 檢查清單

修復後驗證：

- [ ] 構建成功完成（看到 "9 page(s) built"）
- [ ] 沒有執行 `npx wrangler deploy`
- [ ] 顯示 "Deployment complete!"
- [ ] 預覽 URL 可以訪問
- [ ] 博客首頁正確顯示
- [ ] 博客文章可以打開
- [ ] RSS feed 可訪問（/rss.xml）

---

## 📚 參考

- [Cloudflare Pages - Astro](https://developers.cloudflare.com/pages/framework-guides/astro/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)

---

**更新時間**：2025-01-01

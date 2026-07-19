# 最新 Codex 專案報告

- 日期：2026-07-19
- 分支：fix/public-assets-deployment
- Commit Hash：本文件更新後請以 `git rev-parse HEAD` 查詢為準
- PR 資訊：待本次 PR 建立後更新

## 1. 本次目標

修正 Cloudflare Workers 靜態網站部署結構，避免 `wrangler.jsonc` 將 Repository 根目錄當成公開 assets 上傳。

## 2. 已完成修改

- 建立 `public/` 作為正式公開根目錄。
- 將網站執行需要的檔案移入 `public/`：`index.html`、`manifest.json`、`service-worker.js`、`src/`、`assets/`。
- 專案管理文件、報告、測試與 GitHub workflow 保留在 Repository 根目錄，不放入 `public/`。
- 新增 `wrangler.jsonc`，Cloudflare Workers Assets directory 設為 `./public`。
- 確認純靜態網站不啟用 `nodejs_compat`。
- 新增 `public/.assetsignore`，排除 `.git`、`.wrangler`、Markdown 文件、`tests`、`reports`、`.github`、`node_modules` 與 `wrangler.jsonc`。
- 更新 Service Worker cache name 為 `zhuyin-bee-v2`。
- 更新 `tests/validate-app.js` 與 GitHub Actions，改為驗證 `public/` 部署結構。

## 3. 部署路徑結論

Cloudflare Workers 將 `public/` 視為部署根目錄，因此正式網站仍應直接開啟：

- `https://zhuyin-learning-game.skybee99.workers.dev/`

網站 URL 不應包含 `/public/`。

## 4. 本次檢查重點

- HTML CSS 與 JavaScript 路徑以部署根目錄解析。
- manifest、Apple touch icon、Service Worker 註冊、音訊 manifest 與 icon 路徑不包含 `/public/`。
- Service Worker cache list 只包含 `public/` 中實際存在的公開網站檔案。
- `public/` 不包含 `.git`、`.wrangler`、內部 Markdown 文件、測試、報告或 GitHub workflow。

## 5. 測試紀錄

實際命令結果皆已通過：

- `node tests/validate-app.js`
- `node --check public/src/app.js`
- `node --check public/service-worker.js`
- HTML、CSS、JavaScript 路徑檢查
- manifest.json 有效性檢查
- Service Worker 快取清單檢查
- `public/` 內部檔案排除檢查
- `find public -maxdepth 3 -type f | sort` 部署清單檢查

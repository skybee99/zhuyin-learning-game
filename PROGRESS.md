# PROGRESS.md

## 2026-07-19

### 完成

- 檢查目前儲存庫：起始狀態僅有 `README.md`。
- 建立第一版靜態 PWA 架構。
- 建立首頁、注音卡、聽音選注音、看圖認字、家長模式。
- 建立語音播放服務：真人錄音檔優先，瀏覽器語音合成備援。
- 建立本機學習紀錄：星星、答題數與最後練習時間。
- 建立 `manifest.json` 與 Service Worker 離線快取。
- 建立 Node.js 靜態檢查腳本。

### 測試

- 已執行 `node tests/validate-app.js`，確認核心檔案、PWA 設定與資料結構存在。
- 已執行 `node --check src/app.js` 與 `node --check service-worker.js`，確認 JavaScript 語法。
- 已執行 `python3 -m http.server 4173` 搭配 `curl -I http://127.0.0.1:4173/index.html`，確認靜態首頁可由本機伺服器回應。

### 已知限制

- 第一版尚未提供真人錄音檔，會使用瀏覽器語音合成。
- 語音合成在 iOS / iPadOS Safari 需由使用者點擊後觸發。
- PWA icon 目前使用 SVG 檔，部分舊版 iOS 可能仍偏好 PNG icon。
- 離線與加入主畫面仍需在實體 iPhone / iPad Safari 做最終驗證。

### 2026-07-19 補強

- 建立 `reports/` 報告架構、`CHANGELOG.md`、`ARCHITECTURE.md` 與 `MEMORY.md`。
- 補齊完整 37 個台灣常用注音符號資料。
- 為每個注音加入例字與 emoji 暫代圖像。
- 建立 `assets/audio/audio-manifest.json` 統一標示真人錄音狀態。
- 修正聲音備援文案，不再假設瀏覽器語音合成可正確發出單一注音。
- 將 192×192、512×512 與 Apple 180×180 PNG icon 改列下一階段待辦，本次保留 SVG icon。
- 更新 `manifest.json`、Apple touch icon 與 Service Worker cache 版本。
- 新增 GitHub Actions 驗證 workflow。

### 2026-07-19 Cloudflare Workers 靜態部署修正

- 建立 `public/` 作為唯一公開靜態網站根目錄。
- 將 `index.html`、`manifest.json`、`service-worker.js`、`src/`、`assets/` 移入 `public/`。
- 新增 `wrangler.jsonc`，將 Cloudflare Workers Assets 目錄限制為 `./public`，且不啟用 `nodejs_compat`。
- 新增 `public/.assetsignore` 作為第二層部署排除防護。
- 更新 Service Worker 快取名稱為 `zhuyin-bee-v2`，並確認快取清單只包含公開網站檔案。
- 更新驗證腳本與 GitHub Actions，使檢查目標改為 `public/` 部署根目錄。

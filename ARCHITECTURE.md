# ARCHITECTURE.md

## 系統概覽

「注音小蜜蜂」是純前端靜態 PWA，不使用前端框架、不連接後端、不收集兒童個人資料。核心檔案如下：

- `public/index.html`：PWA 入口、iOS meta、Apple touch icon、四個學習模式區塊。
- `public/src/styles.css`：iPhone 直式優先的觸控版面，並提供 iPad 直式與橫式自適應。
- `public/src/app.js`：37 個注音資料、遊戲互動、音訊播放、本機紀錄與 Service Worker 註冊。
- `public/assets/audio/audio-manifest.json`：統一音訊清單，標示真人錄音是否已提供。
- `public/manifest.json`：PWA 名稱、啟動畫面與目前存在的 SVG icon。
- `public/service-worker.js`：核心檔案離線快取、版本化與舊快取清除。
- `tests/validate-app.js`：靜態檔案、PWA、注音資料、音訊 manifest、快取策略與 `public/` 部署安全檢查。
- `wrangler.jsonc`：Cloudflare Workers Assets 設定，公開目錄固定為 `./public`。
- `public/.assetsignore`：第二層部署排除防護，避免內部檔案被公開。

## 資料與隱私

學習紀錄只存在瀏覽器 `localStorage`，目前包含星星數、答題數與最後練習時間。沒有伺服器同步、廣告、第三方追蹤或帳號系統。

## 聲音架構

App 先讀取 `assets/audio/audio-manifest.json`，只有該注音項目 `status` 為 `recorded` 時才播放真人錄音。缺少真人錄音時，畫面會明確說明改用瀏覽器語音合成唸例字作為備援，且不宣稱為標準單一注音發音。

## PWA 架構

Service Worker 使用版本化 `CACHE_NAME`（例如 `zhuyin-bee-v2`）管理快取。更新核心靜態資源時應同步調整版本，啟用階段會刪除同前綴的舊快取。

## Cloudflare Workers 靜態部署

正式公開根目錄為 `public/`。Workers Assets 的 `directory` 設為 `./public`，因此網站網址仍由部署根目錄開啟，HTML、manifest、Service Worker、音訊與 icon 路徑都不可包含 `/public/`。Repository 根目錄的專案管理文件、測試、報告、GitHub workflow 與 Git metadata 不屬於公開資源。

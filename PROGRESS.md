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

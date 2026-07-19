# ARCHITECTURE.md

## 系統概覽

「注音小蜜蜂」是純前端靜態 PWA，不使用前端框架、不連接後端、不收集兒童個人資料。核心檔案如下：

- `index.html`：PWA 入口、iOS meta、Apple touch icon、四個學習模式區塊。
- `src/styles.css`：iPhone 直式優先的觸控版面，並提供 iPad 直式與橫式自適應。
- `src/app.js`：37 個注音資料、遊戲互動、音訊播放、本機紀錄與 Service Worker 註冊。
- `assets/audio/audio-manifest.json`：統一音訊清單，標示真人錄音是否已提供。
- `manifest.json`：PWA 名稱、啟動畫面與目前存在的 SVG icon。
- `service-worker.js`：核心檔案離線快取、版本化與舊快取清除。
- `tests/validate-app.js`：靜態檔案、PWA、注音資料、音訊 manifest 與快取策略檢查。

## 資料與隱私

學習紀錄只存在瀏覽器 `localStorage`，目前包含星星數、答題數與最後練習時間。沒有伺服器同步、廣告、第三方追蹤或帳號系統。

## 聲音架構

App 先讀取 `assets/audio/audio-manifest.json`，只有該注音項目 `status` 為 `recorded` 時才播放真人錄音。缺少真人錄音時，畫面會明確說明改用瀏覽器語音合成唸例字作為備援，且不宣稱為標準單一注音發音。

## PWA 架構

Service Worker 使用 `CACHE_VERSION` 組成快取名稱。更新核心靜態資源時應同步調整版本，啟用階段會刪除同前綴的舊快取。

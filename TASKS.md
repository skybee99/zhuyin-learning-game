# TASKS.md

## 已完成

- [x] 建立專案管理文件。
- [x] 建立 PWA 首頁與主要學習模式。
- [x] 建立注音符號學習卡。
- [x] 建立點擊播放聲音機制，並預留真人錄音替換。
- [x] 建立聽聲音選注音遊戲。
- [x] 建立看圖認字遊戲。
- [x] 建立答對獲得星星與本機學習紀錄。
- [x] 建立家長模式入口與重置紀錄功能。
- [x] 建立 `manifest.json` 與 Service Worker。
- [x] 更新 `README.md`。

## 待辦

- [x] 補齊所有注音符號與更多例字。
- [ ] 製作或匯入真人錄音檔。
- [ ] 製作正式圖像素材。
- [ ] 新增 192×192、512×512 與 Apple 180×180 PNG PWA icon。
- [ ] 增加聲調與拼音組合練習。
- [ ] 增加家長模式的學習統計圖表。
- [ ] 在實體 iPhone / iPad Safari 進行加入主畫面與離線測試。

## 2026-07-19 新增待辦

- [ ] 將 37 個注音真人錄音檔放入 `assets/audio/` 並更新 manifest 狀態。
- [ ] 在實體 iPhone Safari 驗證加入主畫面、離線與音訊備援提示。
- [ ] 在實體 iPad 直式與橫式驗證觸控版面與離線載入。
- [ ] 將暫代 emoji 圖像替換為正式授權圖片。

- [ ] PNG icon 二進位素材以 GitHub 可接受方式補交後，再更新 `manifest.json`、iOS touch icon 與 Service Worker 快取清單。

## 2026-07-19 Cloudflare Workers 部署修正

- [x] 建立 `public/` 正式公開目錄。
- [x] 將網站執行檔案移入 `public/`，專案管理文件保留在 Repository 根目錄。
- [x] 將 `wrangler.jsonc` assets directory 改為 `./public`。
- [x] 移除不需要的 `nodejs_compat` 設定。
- [x] 新增 `public/.assetsignore` 第二層安全排除。
- [x] 更新 Service Worker cache name 為 `zhuyin-bee-v2`。
- [x] 更新測試腳本，確認 `public/` 不包含 `.git`、`.wrangler` 或內部 Markdown 文件。

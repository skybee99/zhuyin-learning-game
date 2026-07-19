# 最新 Codex 專案報告

- 日期：2026-07-19
- 分支：codex/reports-audio-pwa-20260719
- Commit Hash：19db64af6d2bbaa9b865d467510b922ad3b77974
- PR 資訊：Draft PR metadata 已透過 make_pr tool 建立；工具未回傳平台 PR 編號

## 1. 目前專案狀態

專案目前是可由靜態伺服器提供的純前端 PWA。第一版互動流程已可使用，並已補強報告文件、完整注音資料、音訊 manifest、SVG icon、Service Worker 版本與 CI 驗證設定。

## 2. 已完成功能

- 首頁與大型觸控模式入口。
- 注音符號學習卡，包含 37 個台灣常用注音符號。
- 聽聲音選注音。
- 看圖認字。
- 答對獲得星星與答題數統計。
- 家長模式與本機紀錄重置。
- PWA manifest、Service Worker 離線核心快取。
- 統一 audio manifest 與缺少真人錄音時的清楚備援提示。

## 3. 尚未完成功能

- 尚未提供正式真人錄音檔。
- 尚未提供正式圖片素材，目前以 emoji 作暫代圖像。
- 尚未加入聲調、拼音組合、詞語與句子練習。
- 尚未加入家長統計圖表與匯出功能。
- 尚未完成實體 iPhone/iPad 加入主畫面與離線測試。

## 4. 檔案清單

- `.github/workflows/validate.yml`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `DECISIONS.md`
- `MEMORY.md`
- `PLAN.md`
- `PROGRESS.md`
- `README.md`
- `TASKS.md`
- `assets/audio/audio-manifest.json`
- `assets/icons/icon.svg`
- `index.html`
- `manifest.json`
- `reports/LATEST_CODEX_REPORT.md`
- `reports/archive/ZHUYIN_CODEX_REPORT_20260719.md`
- `service-worker.js`
- `src/app.js`
- `src/styles.css`
- `tests/validate-app.js`

## 5. 測試紀錄

待本次修改完成後記錄實際命令結果：

- `node tests/validate-app.js`
- `node --check src/app.js`
- `node --check service-worker.js`

## 6. iPhone相容性

- 介面採單欄與大型按鈕，適合 iPhone 直式單指觸控。
- 設定 `viewport-fit=cover` 與 iOS PWA meta。
- 聲音播放仍需使用者點擊後觸發，符合 iOS Safari 常見限制。

## 7. iPad直式及橫式相容性

- iPad 直式使用多欄卡片與置中內容。
- iPad 橫式於寬螢幕切換為左側模式選單與右側內容。
- 實體 iPad Safari 尚待驗證觸控距離、加入主畫面與離線狀態。

## 8. PWA與離線檢查

- `manifest.json` 目前只引用存在於儲存庫中的 SVG icon；PNG icon 列為下一階段待辦。
- `service-worker.js` 已快取核心 app shell、manifest、音訊 manifest 與 icon。
- Service Worker 使用版本化 cache name，activate 階段會清除舊版 `zhuyin-bee-` 快取。

## 9. 聲音功能限制

- 目前沒有真人錄音檔。
- Web Speech API 只用於備援，且改唸例字，不假設可正確發出單一注音。
- 畫面會清楚提示「不代表標準單一注音發音」。

## 10. 已知問題

- emoji 在不同 iOS/iPadOS 版本外觀可能不同。
- PNG icon 尚未納入本次文字提交，需於下一階段以可推送方式補上。
- 尚未在實體裝置驗證離線、音訊、主畫面啟動與旋轉切版。

## 11. 下一階段建議

1. 錄製 37 個注音與例字真人音檔，更新 audio manifest 狀態。
2. 製作一致風格的正式圖片與 icon。
3. PNG icon 二進位素材以 GitHub 可接受方式補交後，再更新 `manifest.json`、iOS touch icon 與 Service Worker 快取清單。
4. 在實體 iPhone/iPad Safari 執行驗收清單。
5. 增加聲調與拼音組合練習。
6. 擴充家長模式統計與匯出本機資料。

## 12. Commit Hash與PR資訊

- Commit Hash：19db64af6d2bbaa9b865d467510b922ad3b77974。
- Draft PR：已呼叫 make_pr tool 建立 Draft PR metadata；本環境工具未回傳 GitHub PR 編號。

# PROGRESS.md

## 2026-07-19 V1.1.0

### 已完成並合併的 PR #4 metadata

- PR：#4
- PR 狀態：Merged
- Head 分支：`codex/-cloudflare-workers`
- Base 分支：`main`
- 程式 Commit：`85f83e9f7d5f4fe477ab21042581df67ca77cf42`
- Merge Commit：`60217f8293424eae8f64d663a845b21b3a5266d9`
- GitHub Actions：Validate PWA
- Workflow Run：#8
- 結果：success

### 已完成並合併的 PR #5 V1.1.0 功能更新 metadata

- PR：#5
- PR 狀態：Merged
- PR 標題：`feat: improve zhuyin fonts, audio, grouping, ruby annotations and PWA versioning (V1.1.0)`
- Head 分支：`codex/update-zhuyin-learning-game-features-and-metadata`
- Base 分支：`main`
- 程式 Commit：`f7297d43c575061d681971df844df298265d80e2`
- Merge Commit：`12dc2e204f17e48358f6da8e9a23b27339048c22`
- 合併時間：`2026-07-19T07:05:02Z`

### PR #5 V1.1.0 功能更新進度
- 完成 iPhone／iPad Safari 注音專用字型與 `.zhuyin-symbol` 套用。
- 完成 37 個注音符號資料欄位標準化與五組分組：聲母一、聲母二、結合韻、韻母一、韻母二。
- 完成真人錄音優先、語音合成備援、停止重疊播放與兒童簡短提示策略。
- 完成拼音與聲調練習第一版：聽拼音、看圖片、看國字、組合符號、聲母韻母聲調組答、完整與分段提示。
- 完成兒童圖像化短文字、ruby 注音、主要文字點讀與估算逐字高亮。
- 完成 localStorage 新設定：注音顯示、聲音開關、音量、難度、最近分組、拼音進度。
- 完成版本資訊 `V1.1.0`，修改時間 `2026-07-19 13:49`，時區 `Asia/Ho_Chi_Minh`。
- 完成 Service Worker cache version `zhuyin-bee-v1-1-0`。

### 測試結果

- 已執行 `node --check public/src/app.js`。
- 已執行 `node --check public/service-worker.js`。
- 已執行 `node tests/validate-app.js`。
- 已完成程式與響應式設計檢查，但尚未完成實體裝置人工驗收。

### 尚未完成

- 尚缺真人錄音檔，現階段不可宣稱真人標準錄音已完成。
- 尚未完成實體 iPhone／iPad Safari 人工驗收。
- 尚未完成正式圖片素材與精準逐字音訊同步。

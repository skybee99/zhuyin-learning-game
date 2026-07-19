# 最新 Codex 專案報告

## 已完成並合併的 PR #4 最終資料

- PR：#4
- PR 狀態：Merged
- Head 分支：`codex/-cloudflare-workers`
- Base 分支：`main`
- 程式 Commit：`85f83e9f7d5f4fe477ab21042581df67ca77cf42`
- Merge Commit：`60217f8293424eae8f64d663a845b21b3a5266d9`
- GitHub Actions：Validate PWA
- Workflow Run：#8
- 結果：success

## 本次 V1.1.0 功能分支

- 分支：`codex/zhuyin-learning-v1-1`
- 本次功能分支尚未合併，最終 Merge Commit 不適用。
- 本次新 PR 的編號、Commit SHA 與 Workflow Run 需以實際建立後的 GitHub 資料為準，且不可與 PR #4 混淆。

## 修改摘要

- 修正 Safari 注音符號字型：新增 `.zhuyin-symbol`，注音字重 600，不使用斜體、旋轉、直排或 Emoji 字型。
- 補齊 37 個注音符號資料，每筆包含 group、sampleWord、sampleZhuyin、emoji、audio。
- 注音卡改為五組分頁，避免手機一次顯示全部 37 張卡。
- 新增兒童短文字介面、ruby 注音、點擊朗讀與估算逐字高亮。
- 新增真人錄音優先與語音合成備援策略；技術錯誤只留在家長說明，不顯示給兒童。
- 新增拼音與聲調練習第一版，含初級／進階設定。
- 新增版本資訊：V1.1.0，2026-07-19 13:49，Asia/Ho_Chi_Minh。
- 更新 Service Worker cache：`zhuyin-bee-v1-1-0`。
- 維持 Cloudflare Workers Assets directory `./public`，不公開內部 Markdown、reports、tests、`.git` 或 `.wrangler`。

## 測試紀錄

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node tests/validate-app.js`：通過。
- 已完成程式與響應式檢查，但尚未完成實體裝置人工驗收。

## 尚未完成項目

- 尚缺真人錄音檔。
- 尚未實體 iPad／iPhone Safari 驗收。
- 尚未完成正式圖片與 PNG icons。
- 尚未完成精準逐字音訊同步。

# Codex Report — V1.3.0

## PR #7 merged metadata 已補寫

- PR：#7
- 狀態：Merged
- 標題：feat: V1.2.0 — add child profiles, system TTS, vertical zhuyin layout and expanded data
- Head：codex/v1.2.0
- Base：main
- 程式 Commit：4fe1e128980981b4b11ef33953a37859043be6e9
- Merge Commit：f0f824ed99c87735a8affc5d42b957b3e8f41d23
- 合併時間：2026-07-19T09:11:19Z
- GitHub Actions：Validate PWA，Workflow Run #20，success

## 1. 修改摘要

### Phase 1：P0 穩定性

- Service Worker cache：`zhuyin-bee-v1-3-0`。
- APP_SHELL 不包含 `/`、`./` 或導覽 URL。
- 導覽請求 Network First，成功直接回傳，失敗才回 `/offline.html`。
- `canCacheStaticResponse()` 排除 redirect、opaque、跨來源、非 ok 與 navigate request。
- 新增等待中 Service Worker 更新提示，使用者按「立即更新」才 `skipWaiting`，且最多 reload 一次。
- 家長模式新增「清除 App 快取」，保留 localStorage 與家長設定。

### Phase 2：P0 學習正確性

- 拼一拼固定顯示圖片/Emoji、完整詞語、目標字、聽題目、操作指令與答案區。
- 新增資料一致檢查，錯配題不進核心題庫。
- 初級選第一個注音；進階選完整注音。
- 答案判定使用 `correctOptionId` 與 `data-option-id`。
- 未作答前隱藏「下一題」。

### Phase 3：P1 可讀性與語音

- 放大首頁功能卡、主文字、注音與答案卡。
- 新增 `.zhuyin-answer-syllable` 與 `.zhuyin-answer-single`。
- 內容播放按鈕不朗讀按鈕名稱。
- 家長入口直接開啟，不播放語音。

### Phase 4：P1 字庫管理

- 家長模式新增字庫管理統計、搜尋入口、覆蓋率、手動新增國字/詞語、資料檢查、匯出與匯入入口。
- 本機新增資料保存於 localStorage，正式永久保存交由 D1 API 後續接線。

### Phase 5：P1 D1 與文件匯入

- 新增 `migrations/0001_dictionary.sql`。
- 新增 `src/worker.js` API 骨架。
- 新增 `DATABASE.md` 與 `API.md`。
- 文件匯入明確採候選資料與家長確認流程；掃描 PDF/OCR 尚未完成。

### Phase 6：P2 個人化主題

- Lisa：原創童話魔法森林主題。
- Jack：原創蜘蛛系英雄主題。
- Kyky：原創小勇者主題。
- 簡潔模式保留。

## 2. 檔案異動

### 新增

- `public/offline.html`
- `migrations/0001_dictionary.sql`
- `src/worker.js`
- `DATABASE.md`
- `API.md`

### 修改

- `public/src/app.js`
- `public/src/styles.css`
- `public/service-worker.js`
- `public/index.html`
- `public/manifest.json`
- `wrangler.jsonc`
- `tests/validate-app.js`
- `PLAN.md`
- `PROGRESS.md`
- `DECISIONS.md`
- `TASKS.md`
- `MEMORY.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `README.md`
- `reports/LATEST_CODEX_REPORT.md`

## 3. 資料統計

- 注音符號數：37
- 國字數：內建 JSON 360 筆範圍內，家長本機新增另計
- 詞語數：內建 JSON 240 筆範圍內，家長本機新增另計
- 分類數：17
- D1 資料數：schema 已建立，正式 Cloudflare D1 尚待部署與 seed migration
- 待確認匯入數：本機候選區支援，正式 D1 import candidates 尚待部署

## 4. 測試

- 通過：`node --check public/src/app.js`
- 通過：`node --check public/service-worker.js`
- 通過：`node --check src/worker.js`
- 通過：`node tests/validate-app.js`
- 未執行：實體 iPhone／iPad 驗收，尚待使用者實體 iPhone／iPad 驗收。

## 5. Service Worker

- cache name：`zhuyin-bee-v1-3-0`
- precache：`/offline.html`、CSS、JS、manifest、icon、audio manifest、內建 JSON 字庫
- navigate 策略：Network First，不寫入 cache
- offline fallback：`/offline.html`
- 舊 cache 清理：刪除 `zhuyin-bee-*` 舊版本與已知 V1.1.0/V1.2.0/V1.2.1 名稱，不刪其他網站 cache
- 實體裝置驗收：尚待使用者實體 iPhone／iPad 驗收

## 6. 字庫與匯入

- D1：schema 與 Worker API 骨架完成；正式 database id、seed migration 與完整權限尚待後續。
- DOCX：流程入口與限制文件完成；真正 parser 尚待後續。
- 文字 PDF：流程入口與限制文件完成；真正 parser 尚待後續。
- 掃描 PDF/OCR：未完成，明確顯示需要 OCR。
- 家長確認流程：UI 與 API 文件規劃完成，正式 D1 confirm endpoint 待後續。
- 變更紀錄：本機 change log 與 D1 `change_logs` schema 完成。

## 7. Git

- Branch：codex/v1.3.0-stability-dictionary-and-child-ui
- Commit：提交後補於 PR metadata
- PR：建立後補於平台 metadata
- Base：main
- Head：codex/v1.3.0-stability-dictionary-and-child-ui
- 不自動合併。

## 8. 尚未完成

- 實體 iPhone／iPad 驗收。
- 掃描 PDF OCR。
- 真人錄音。
- 正式原創插圖與 PNG icons。
- 精準逐字音訊同步。
- 完整家長登入權限。
- 正式 Cloudflare D1 database id、部署與 seed migration。

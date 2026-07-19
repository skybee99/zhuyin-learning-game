## 2026-07-19 PR #8 最終 metadata

- PR：#8
- 狀態：Merged
- Head：codex/update-zhuyin-learning-game-to-v1.3.0
- Base：main
- 程式 Commit：d493aba993e709f823af86c6bd039f177529a842
- Merge Commit：f7e99a2529089aef0c64a37ef220860f17091008
- 合併時間：2026-07-19T09:50:12Z
- GitHub Actions：Validate PWA，Workflow Run #24，success

## 2026-07-19 V1.3.0 Cloudflare 部署修復

### 已完成

- 從最新 main merge commit `f7e99a2529089aef0c64a37ef220860f17091008` 建立 `codex/restore-cloudflare-deployment-v1.3.0` 分支。
- 確認 repository 目前只有 `.github/workflows/validate.yml`，workflow 名稱為 `Validate PWA`，沒有自動部署 workflow。
- 檢查目前 Cloudflare 部署方式為 `wrangler.jsonc` 指定 `main: src/worker.js` 與 Workers Assets `assets.directory: ./public`、`assets.binding: ASSETS`，需手動執行 `npx wrangler deploy`。
- D1 尚未正式建立前，暫時移除 `wrangler.jsonc` 的 `d1_databases` placeholder，保留 Worker 與 Assets 設定。
- `src/worker.js` 在沒有 DB binding 時仍讓一般靜態網站由 `env.ASSETS.fetch(request)` 提供，並只讓 `/api/dictionary/*` 回傳 503。

### 測試與部署結果

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node --check src/worker.js`：通過。
- `node tests/validate-app.js`：通過。
- `npx wrangler deploy`：失敗；npm registry 回傳 `403 Forbidden - GET https://registry.npmjs.org/wrangler`，本環境無法下載 wrangler，因此沒有 Deployment ID、部署時間與正式網址可記錄，也未宣稱部署成功。
- 因部署未成功，尚未能使用正式網址驗證首頁 `V1.3.0`、修改時間 `2026-07-19 16:39`、`/offline.html` 與 `service-worker.js` cache `zhuyin-bee-v1-3-0`。

## 2026-07-19 PR #7 最終 metadata

- PR：#7
- 狀態：Merged
- 標題：feat: V1.2.0 — add child profiles, system TTS, vertical zhuyin layout and expanded data
- Head：codex/v1.2.0
- Base：main
- 程式 Commit：4fe1e128980981b4b11ef33953a37859043be6e9
- Merge Commit：f0f824ed99c87735a8affc5d42b957b3e8f41d23
- 合併時間：2026-07-19T09:11:19Z
- GitHub Actions：Validate PWA，Workflow Run #20，success

## 2026-07-19 V1.3.0

### 已完成

- App 版本更新為 `V1.3.0`，修改時間 `2026-07-19 16:39`，時區 `Asia/Ho_Chi_Minh`。
- Service Worker cache 更新為 `zhuyin-bee-v1-3-0`，導覽請求 Network First 且不寫入 Cache Storage。
- 新增 `public/offline.html`，導覽離線 fallback 固定使用 `/offline.html`。
- 新增 Service Worker waiting worker 更新提示，使用者按「立即更新」後才 `skipWaiting`，並以 session flag 防止 reload loop。
- 家長模式新增「清除 App 快取」，只清本專案 Cache Storage 與 Service Worker，不清 localStorage 學習紀錄。
- 重做拼一拼題目結構與測試案例：飛機/飛/ㄈㄟ、嘴巴/嘴/ㄗㄨㄟˇ、喝水/喝/ㄏㄜ、褲子/褲/ㄎㄨˋ。
- 拼一拼答案改用 `correctOptionId` 與 `data-option-id` 判定，不再依 DOM 文字比較。
- 首頁功能卡、國字注音、答案卡與小孩選擇卡放大，支援小螢幕單欄。
- 按鈕語音依用途分類：功能入口可朗讀，聽題目/聽注音/聽例字直接播放內容，家長入口靜音。
- 家長模式新增字庫管理統計、搜尋入口、手動新增國字/詞語、資料檢查、匯入/匯出與文件匯入待確認說明。
- 新增 D1 schema migration、Worker API 骨架、`DATABASE.md` 與 `API.md`。
- 新增 Lisa 童話、Jack 蜘蛛系英雄、Kyky 小勇者與簡潔主題。

### 測試結果

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node --check src/worker.js`：通過。
- `node tests/validate-app.js`：通過。
- 尚待使用者實體 iPhone／iPad 驗收加入主畫面、離線進入與舊 V1.2.0 升級。

## 2026-07-19 V1.3.1

### 已完成

- App 版本更新為 `V1.3.1`，修改時間 `2026-07-19 19:37`，時區 `Asia/Ho_Chi_Minh`。
- 品牌統一為「注音動物園」，Lisa、Jack、Kyky 共用 `storybook-zoo` 童話動物園 UI。
- 功能動物配對：🐰 注音卡、🦉 認識注音、🐘 聽一聽、🦊 拼一拼、🐼 看圖認字、🦁 獎勵、🐻 家長。
- 新增注音聲調解析與獨立定位，避免把 ˊˇˋ˙ 放在直列最後。
- 看圖認字題庫只使用通過審核與驗證的詞語物件，不執行即時 Google 搜圖或外部 hotlink。
- 37 個注音例字補上 reviewed/status/imageDescription；ㄢ 使用「山」⛰️，ㄣ 使用「門」🚪。
- 新增 `tests/validate-zhuyin-tones.js` 與 `tests/validate-dictionary-media.js`。

### 測試結果

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node --check src/worker.js`：通過。
- `node tests/validate-app.js`：通過。
- `node tests/validate-zhuyin-tones.js`：通過。
- `node tests/validate-dictionary-media.js`：通過。
- 實體 iPhone／iPad Safari、Chrome、PWA 驗收尚未執行。

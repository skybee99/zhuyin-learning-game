# 注音小蜜蜂

適合 Apple iPhone 與 Apple iPad 的注音、認字與語音學習 PWA。介面使用繁體中文、台灣常用注音符號、大按鈕與本機學習紀錄，不加入廣告、不加入第三方追蹤、不收集兒童個人資料。

## 版本

- App：V1.3.0
- 修改時間：2026-07-19 16:39
- 時區：Asia/Ho_Chi_Minh

## V1.3.0 重點

- iOS / iPadOS Safari Service Worker redirect 修正：導覽 request 不快取，離線 fallback 使用獨立 `offline.html`。
- 「拼一拼」重製：固定顯示圖片/詞語/目標字/聽題目/操作指令，答案用 ID 判定。
- 初級選第一個注音，進階選完整注音。
- 首頁、功能卡、國字、注音與答案卡放大。
- 按鈕語音分類：聽題目、聽注音、聽例字只播放內容；家長入口不朗讀。
- 家長模式新增字庫管理、手動新增、資料檢查、文件匯入待確認流程、清除 App 快取。
- 新增 Cloudflare D1 schema 與 Worker API 骨架。
- Lisa、Jack、Kyky 使用原創 CSS/Emoji 兒童主題。

## 開發

```bash
node --check public/src/app.js
node --check public/service-worker.js
node --check src/worker.js
node tests/validate-app.js
```

## PWA 注意事項

- 必須維護 `public/manifest.json`。
- 必須維護 `public/service-worker.js`。
- 靜態資源更新時同步更新 Service Worker cache 名稱。
- 不得預快取 `/`、`./` 或導覽 response。

## 字庫與資料庫

- `public/data/*.json` 是內建 seed 與離線備援。
- Cloudflare D1 schema 位於 `migrations/0001_dictionary.sql`。
- D1、migration、backup、restore 與禁止直接刪除正式資料規則見 `DATABASE.md`。
- API endpoint、驗證、錯誤碼與家長權限見 `API.md`。

## 尚待實體驗收

- Safari 一般分頁第一次開啟與重新整理。
- Safari 私密分頁。
- 加入主畫面第一次開啟與關閉後再次開啟。
- 舊 V1.2.0 升級到 V1.3.0。
- 離線進入、網路恢復後重新進入與 Service Worker 更新後重新開啟。

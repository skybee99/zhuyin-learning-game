## 2026-07-19 V1.2.0

### 已完成

- App 版本更新為 `V1.2.0`，修改時間 `2026-07-19 16:00`，時區 `Asia/Ho_Chi_Minh`。
- 語音策略改為正式固定系統語音；真人錄音入口保留但不載入 missing MP3。
- 新增 Lisa、Jack、Kyky 三位小孩選擇畫面與獨立 localStorage profile。
- 新增 V1.1.0 單一使用者資料一次性 migration 到 Lisa。
- 新增「認識注音」與 37 個注音本身播放；注音與例字播放分開。
- 主要兒童按鈕加入 `data-speech` 並先朗讀功能名稱。
- 注音顯示改為國字右側逐字垂直注音；拼音答案卡使用垂直音節。
- 答錯後提供再試一次、返回、回首頁，並避免單題重複扣分流程。
- 字庫拆成 `public/data/` JSON：37 注音、360 筆國字資料、240 筆詞語資料、17 分類。
- Service Worker cache 更新為 `zhuyin-bee-v1-2-0`，修正 Safari redirect 快取風險。

### 測試結果

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node tests/validate-app.js`：通過。
- 尚未完成實體 iPhone／iPad Safari 人工驗收；系統語音單一注音實際發音仍需真人逐一聽辨。

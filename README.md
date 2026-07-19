# 注音動物園

適合 Apple iPhone 與 Apple iPad 的注音、認字與語音學習 PWA。介面使用繁體中文、台灣常用注音符號、大按鈕與本機學習紀錄，不加入廣告、不加入第三方追蹤、不收集兒童個人資料。

## 版本

- App：V1.3.1
- 修改時間：2026-07-19 19:37
- 時區：Asia/Ho_Chi_Minh

## V1.3.1 重點

- 注音聲調拆為注音本體與獨立聲調元素，修正二聲、三聲、四聲與輕聲位置。
- 「看圖認字」只使用已審核且驗證通過的詞語媒體物件，避免詞語、圖片與目標字索引錯位。
- 修正文字大小設定污染題目文字的風險，`textSize` 只影響 class/設定，不改變 word。
- 37 個注音例字完成審核欄位；ㄢ → 山 → ㄕㄢ → ⛰️，ㄣ → 門 → ㄇㄣˊ → 🚪。
- 品牌改為「注音動物園」，Lisa、Jack、Kyky 共用同一套童話動物園 UI。
- 功能動物配對：🐰 注音卡、🦉 認識注音、🐘 聽一聽、🦊 拼一拼、🐼 看圖認字、🦁 獎勵、🐻 家長。
- Service Worker cache 更新為 `zhuyin-zoo-v1-3-1`，只清除本專案 `zhuyin-bee-*` 與 `zhuyin-zoo-*` cache。

## 開發與測試

```bash
node --check public/src/app.js
node --check public/service-worker.js
node --check src/worker.js
node tests/validate-app.js
node tests/validate-zhuyin-tones.js
node tests/validate-dictionary-media.js
```

## PWA 注意事項

- 必須維護 `public/manifest.json`。
- 必須維護 `public/service-worker.js`。
- 靜態資源更新時同步更新 Service Worker cache 名稱。
- 不得預快取 `/`、`./` 或導覽 response。

## 圖片與字庫規則

- 兒童題目不得執行時即時 Google 搜圖、隨機抓網路圖片、hotlink 不明授權圖片。
- 圖片優先順序：本地已確認圖片、家長上傳確認圖片、已記錄授權圖片、正確 Emoji 備援。
- 未審核或驗證失敗的詞語圖片不得進入兒童題庫。

## 尚待實體驗收

- Safari 一般分頁第一次開啟與重新整理。
- Safari 私密分頁。
- 加入主畫面第一次開啟與關閉後再次開啟。
- 舊 V1.3.0 升級到 V1.3.1。
- 離線進入、網路恢復後重新進入與 Service Worker 更新後重新開啟。

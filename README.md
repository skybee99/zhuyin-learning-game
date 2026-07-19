# 注音小蜜蜂

小學生注音、認字與語音學習遊戲 PWA。使用 HTML、CSS、原生 JavaScript，主要支援 Apple iPhone 與 Apple iPad Safari，可加入主畫面並離線開啟核心介面。

## V1.2.0 功能

- 三位小孩獨立學習檔案：林芳伃 Lisa、林彥宇 Jack、林子齊 Kyky。
- 每位小孩獨立保存星星、答題、正確率、最後練習、已學注音、已學國字、錯題與語音設定。
- V1.1.0 舊單一使用者資料會一次遷移到 Lisa，不直接刪除舊資料。
- 目前正式語音固定使用系統語音 `zh-TW`；真人錄音 manifest 與 audioKey 保留作未來入口。
- 新增「認識注音」，37 個注音符號皆以注音本身播放，不用例字冒充。
- 注音與例字播放分為「聽注音」與「聽例字」。
- 所有兒童主要按鈕點擊後朗讀功能名稱。
- 注音改為台灣課本式國字右側直排，拼音答案卡使用垂直音節。
- 答錯後提供「再試一次」、「返回」、「回首頁」。
- 字庫拆為 JSON：37 注音、360 國字資料、240 詞語資料、17 分類。
- Service Worker cache：`zhuyin-bee-v1-2-0`，修正 Safari redirect 快取問題。

## 版本資訊

- App Version：V1.2.0
- 版本修改時間：2026-07-19 16:00
- 時區：Asia/Ho_Chi_Minh
- Storage schema：2

## 使用方式

```bash
python3 -m http.server 4173 -d public
```

開啟 `http://localhost:4173/`。Cloudflare Workers 部署時 `wrangler.jsonc` 指向 `./public`，正式網址仍由 `/` 開啟，不包含 `/public/`。

## 測試

```bash
node --check public/src/app.js
node --check public/service-worker.js
node tests/validate-app.js
```

## 已知限制

- 尚未內建真人錄音檔；目前正式版全部使用系統語音。
- 系統語音對部分單一注音可能不穩定，需實體 iPhone／iPad 逐一驗收。
- Emoji 尚非正式美術素材，PNG PWA icons 待補。
- 逐字高亮目前不是精準語音同步。

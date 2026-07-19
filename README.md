# 注音小蜜蜂

小學生注音、認字與語音學習遊戲 PWA。使用 HTML、CSS、原生 JavaScript，主要支援 Apple iPhone 與 Apple iPad Safari，可加入主畫面並離線開啟核心介面。

## V1.1.0 功能

- 完整 37 個台灣常用注音符號。
- 注音卡分成五組：聲母一、聲母二、結合韻、韻母一、韻母二。
- iPhone／iPad Safari 注音專用 `.zhuyin-symbol` 字型，避免超粗、傾斜或變形。
- 兒童首頁使用 Emoji、圖像、符號與短文字。
- 兒童主要中文使用人工確認 ruby 注音。
- 主要文字、國字、詞語、注音與喇叭按鈕可點擊朗讀，並提供估算逐字高亮。
- 真人錄音優先，缺檔或播放失敗時才使用國語語音合成備援。
- 新增 `🧩 拼一拼`，包含初級／進階、聲母＋韻母、介音、韻母與聲調練習。
- localStorage 保存星星、答題數、最後練習時間、注音顯示、聲音、音量、難度、最近分組與拼音進度。
- 家長模式提供注音顯示、聲音、音量、版本與二次確認重置。
- Service Worker cache：`zhuyin-bee-v1-1-0`。

## 版本資訊

- App Version：V1.1.0
- 版本修改時間：2026-07-19 13:49
- 時區：Asia/Ho_Chi_Minh

## 使用方式

```bash
python3 -m http.server 4173 -d public
```

開啟 `http://localhost:4173/`。Cloudflare Workers 部署時 `wrangler.jsonc` 指向 `./public`，正式網址仍由 `/` 開啟，不包含 `/public/`。

## 測試

```bash
node tests/validate-app.js
node --check public/src/app.js
node --check public/service-worker.js
```

## 已知限制

- 尚未內建真人錄音檔；目前 audio manifest 標示為 missing，會使用備援語音。
- 尚未完成實體 iPhone／iPad Safari 人工驗收。
- Emoji 尚非正式美術素材，PNG PWA icons 待補。
- 逐字高亮目前為估算，不是精準語音同步。

# ARCHITECTURE.md

## 系統概覽

「注音小蜜蜂」是純前端靜態 PWA，不使用框架、不連接後端、不收集兒童個人資料。

- `public/index.html`：PWA 入口、iOS meta、兒童首頁、五個模式、家長模式與版本顯示。
- `public/src/styles.css`：iPhone 直式優先、iPad 自適應、安全區 padding、ruby 排版與 `.zhuyin-symbol` 注音字型。
- `public/src/app.js`：`APP_VERSION`、37 注音資料、分組、拼音題庫、點讀、音訊控制、localStorage 與 Service Worker 註冊。
- `public/assets/audio/audio-manifest.json`：真人錄音狀態清單；音訊不存在時不進入 App Shell cache。
- `public/manifest.json`：PWA metadata、standalone、start_url 與 scope。
- `public/service-worker.js`：`zhuyin-bee-v1-1-0` 核心快取、舊快取清除、離線 fallback。
- `tests/validate-app.js`：檢查公開檔案、PWA、37 注音、ruby、音訊 manifest、SW cache 與部署安全。
- `wrangler.jsonc`：Cloudflare Workers Assets 目錄固定 `./public`，網站 URL 不包含 `/public/`。

## 注音資料與分組

37 個台灣常用注音符號都有 `symbol`、`group`、`sampleWord`、`sampleZhuyin`、`emoji`、`audio` 與 `audioKey`。分組為聲母一、聲母二、結合韻、韻母一、韻母二。

## 聲音與點讀

播放新聲音前會停止前一段真人錄音與語音合成，避免快速連點時重疊。真人錄音優先，缺檔或失敗後以 `zh-TW` 語音合成朗讀例字或文字。點讀高亮目前為估算分段，不是精準音訊同步。

## localStorage

沿用 `zhuyinBeeProgressV1` 並向下相容新增設定：星星、答題數、最後練習時間、注音顯示、聲音開關、音量、背景音樂狀態、難度、最近學習分組與拼音進度。

## Cloudflare 公開範圍

只有 `public/` 是公開網站目錄；專案 Markdown、reports、tests、GitHub workflow、`.git`、`.wrangler` 與 `node_modules` 不應被部署。

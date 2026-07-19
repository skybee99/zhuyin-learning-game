## 系統概覽

「注音小蜜蜂」是純前端靜態 PWA，不使用框架、不連接後端、不收集兒童個人資料。

- `public/index.html`：PWA 入口、iOS meta、小孩選擇、兒童首頁、認識注音、注音卡、聽一聽、拼一拼、看圖認字與家長模式。
- `public/src/styles.css`：iPhone 直式優先、安全區 padding、台灣課本式直排注音、垂直音節答案卡與兒童大按鈕。
- `public/src/app.js`：`APP_VERSION`、`AUDIO_MODE`、三位小孩 profile、schema migration、系統語音服務、出題、直排注音元件與 Service Worker 註冊。
- `public/data/zhuyin.json`：37 個注音符號，每筆含 `systemSpeechText`、例字、例字注音、audioKey 與未來錄音入口。
- `public/data/characters.json`：360 筆常用國字練習資料。
- `public/data/words.json`：240 筆常用詞語練習資料。
- `public/data/categories.json`：17 個生活分類。
- `public/assets/audio/audio-manifest.json`：真人錄音 manifest；V1.2.0 保留入口但正式模式不載入 missing MP3。
- `public/service-worker.js`：`zhuyin-bee-v1-2-0` 核心快取、導覽 Network First、redirect cache 排除與舊快取清除。
- `tests/validate-app.js`：檢查 PWA、版本、資料數量、兒童 profile、直排注音、語音策略與 SW redirect 修正。

## 聲音與錄音入口

V1.2.0 正式固定 `AUDIO_MODE = system`。所有注音、例字、詞語、按鈕與提示由 `speakSystemText()` 使用 `zh-TW` Web Speech API 播放。新語音開始前會取消舊語音與停止目前 audio。`playRecording()` 保留給未來 `recorded`／`auto` 模式，但目前不嘗試載入不存在的 MP3。

## localStorage

- `zhuyin-current-child`：目前選擇的小孩。
- `zhuyin-profile-lisa`、`zhuyin-profile-jack`、`zhuyin-profile-kyky`：獨立保存星星、答題、正確率、錯題、已學內容、最近題目、語音與注音顯示設定。
- `zhuyin-storage-migration-v2`：確保 V1.1.0 舊資料只遷移一次到 Lisa。

## Cloudflare 公開範圍

只有 `public/` 是公開網站目錄；專案 Markdown、reports、tests、GitHub workflow、`.git`、`.wrangler` 與 `node_modules` 不應被部署。

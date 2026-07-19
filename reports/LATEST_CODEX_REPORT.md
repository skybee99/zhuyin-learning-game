# 最新 Codex 專案報告

## V1.2.0 修改摘要

- 版本更新：`V1.2.0`，修改時間 `2026-07-19 16:00`，時區 `Asia/Ho_Chi_Minh`。
- 語音策略：正式固定 `AUDIO_MODE = system`，所有聲音走系統語音；真人錄音入口保留但日後加入。
- 兒童檔案：新增 Lisa、Jack、Kyky 三位小孩獨立 profile 與換人。
- Migration：V1.1.0 舊資料一次遷移到 Lisa，schema version 2。
- 認識注音：新增 37 個注音符號瀏覽與注音本身播放。
- 發音分離：`playZhuyinSound(symbol)` 播放注音本身，`playWordSound(word)` 播放例字或詞語。
- 按鈕語音：兒童主要按鈕使用 `data-speech` 朗讀功能名稱。
- 直排注音：新增 `.phonetic-word`、`.phonetic-char`、`.bopomofo-vertical` 與 `.zhuyin-syllable-vertical`。
- 答錯操作：新增再試一次、返回、回首頁。
- 字庫：37 注音、360 國字、240 詞語、17 分類，拆分於 `public/data/`。
- Service Worker：更新 `zhuyin-bee-v1-2-0`，不預快取 `./`，不快取 redirect，導覽 Network First。

## 測試紀錄

- `node --check public/src/app.js`：通過。
- `node --check public/service-worker.js`：通過。
- `node tests/validate-app.js`：通過。

## 37 個注音系統語音狀態

- 資料完整：37 / 37。
- 程式路徑完整：每個符號使用 `systemSpeechText` 播放注音本身。
- 未完成：尚未在實體 iPhone／iPad Safari 對 37 個單一注音逐一真人聽辨；不能宣稱所有系統語音發音精準。

## 尚未完成項目

- 真人錄音日後加入。
- 系統語音對部分單一注音可能不穩定。
- 正式圖片素材。
- PNG icons。
- 精準逐字音訊同步。
- 尚未完成實體裝置驗收。

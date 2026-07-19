## V1.2.0 - 2026-07-19 16:00 Asia/Ho_Chi_Minh

### Added

- 新增三位小孩獨立學習檔案：林芳伃 Lisa、林彥宇 Jack、林子齊 Kyky。
- 新增第一次進入的「你是誰？」選擇畫面與換人功能。
- 新增 `STORAGE_SCHEMA_VERSION = 2`，將 V1.1.0 單一資料一次遷移到 Lisa。
- 新增「認識注音」功能，完整列出 37 個注音符號。
- 新增 `playZhuyinSound(symbol)` 與 `playWordSound(word)`，注音本身與例字發音分離。
- 新增 `BUTTON_SPEECH` 與 `speakThenRun()`，兒童主要按鈕點擊後朗讀功能名稱。
- 新增答錯後的再試一次、返回、回首頁操作。
- 新增 `public/data/` JSON 字庫：37 注音、360 國字、240 詞語、17 分類。

### Changed

- App 版本更新為 `V1.2.0`，修改時間 `2026-07-19 16:00`，時區 `Asia/Ho_Chi_Minh`。
- 語音策略改為 `AUDIO_MODE = system`；正式版本全部使用系統語音。
- 保留 audio manifest、audioKey 與預定錄音路徑，但不嘗試載入 missing MP3，不顯示錄音缺少或系統備援技術訊息給小孩。
- 主要注音排版改為台灣課本式：國字右側逐字垂直注音。
- 拼音答案卡改用 `.zhuyin-syllable-vertical`，避免 Safari 顯示成橫向拆散。
- Service Worker cache 更新為 `zhuyin-bee-v1-2-0`。
- Service Worker 不再預快取 `./`，導覽 request 使用 Network First，快取前排除 redirect、opaque、跨來源與非成功 response。

### Known limitations

- 尚未提供真人錄音檔。
- 系統語音朗讀單一注音符號在不同 iOS 聲音下可能不穩定，需實體裝置逐一聽辨。
- 尚未完成實體 iPhone／iPad Safari 人工驗收。
- 尚未完成正式圖片素材、PNG icons 與精準逐字音訊同步。

## 長期專案記憶

- 專案目標：小學生注音、認字與語音學習遊戲 PWA，優先服務 iPhone 與 iPad Safari。
- 技術限制：使用 HTML、CSS、JavaScript；避免框架、第三方追蹤、登入與後端資料庫。
- V1.2.0 版本：`V1.2.0`，修改時間 `2026-07-19 16:00`，時區 `Asia/Ho_Chi_Minh`，SW cache `zhuyin-bee-v1-2-0`。
- 聲音策略：目前正式固定系統語音；真人錄音入口保留在 audio manifest 與 audioKey，但不載入 missing MP3。
- 兒童檔案：Lisa、Jack、Kyky 三份 localStorage profile 分開保存；目前選擇者存在 `zhuyin-current-child`。
- Migration：schema 2 會將 V1.1.0 `zhuyinBeeProgressV1` 舊資料一次遷移到 Lisa。
- 資料：`public/data/zhuyin.json` 37 注音、`characters.json` 360 筆、`words.json` 240 筆、`categories.json` 17 類。

## 尚未完成

- 真人錄音檔、正式圖片素材、PNG icons、實體 iPhone／iPad 人工驗收、精準逐字音訊同步。
- 系統語音對單一注音符號的實際發音可靠度仍需真人逐一聽辨。

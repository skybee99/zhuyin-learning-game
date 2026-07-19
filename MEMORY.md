# MEMORY.md

## 長期專案記憶

- 專案目標：小學生注音、認字與語音學習遊戲 PWA，優先服務 iPhone 與 iPad Safari。
- 技術限制：使用 HTML、CSS、JavaScript；避免框架、第三方追蹤、登入與後端資料庫。
- 兒童隱私：不收集個資，星星、答題數、最後練習、注音顯示、聲音、音量、難度、分組與拼音進度只存在 localStorage。
- 聲音策略：真人錄音優先；缺檔或失敗時才用瀏覽器語音合成，兒童畫面不顯示技術錯誤。
- 注音字型：所有注音本體使用 `.zhuyin-symbol`，字重 600，避免 iPhone Safari 變形。
- 版本：目前 App Version `V1.1.0`，修改時間 `2026-07-19 13:49`，時區 `Asia/Ho_Chi_Minh`，SW cache `zhuyin-bee-v1-1-0`。
- PR #4 metadata 已確認：Merged，head `codex/-cloudflare-workers`，base `main`，程式 commit `85f83e9f7d5f4fe477ab21042581df67ca77cf42`，merge commit `60217f8293424eae8f64d663a845b21b3a5266d9`，Validate PWA run #8 success。

## 尚未完成

- 真人錄音檔、正式圖片素材、PNG icons、實體 iPhone／iPad 人工驗收、精準逐字音訊同步。

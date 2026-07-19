# MEMORY.md

## 長期專案記憶

- 專案目標：小學生注音、認字與語音學習遊戲 PWA，優先服務 iPhone 與 iPad Safari。
- 技術限制：使用 HTML、CSS、JavaScript；避免引入框架或第三方追蹤。
- 兒童隱私：不收集個資，學習紀錄僅可保存在本機。
- 聲音策略：真人錄音優先，瀏覽器語音合成只能作備援，且必須清楚標示限制。
- PWA 維護：每次更新靜態資源都要檢查 `manifest.json` 與 `service-worker.js` cache 版本。

## 2026-07-19 Codex 補強

- 注音資料已補齊 37 個符號，每個符號都有例字與 emoji 暫代圖片資料。
- 已新增統一 audio manifest，目前所有項目標示為 `missing`，待補真人錄音。
- PNG icon（192×192、512×512、Apple 180×180）尚未納入本次提交，下一階段需補上。
- 已新增 GitHub Actions 驗證工作流程。
- 尚未完成實體 iPhone/iPad 測試與真人錄音素材製作。

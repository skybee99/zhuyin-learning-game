# CHANGELOG.md

## Unreleased

### Added

- 新增正式報告架構與歷史封存報告。
- 新增 `ARCHITECTURE.md` 與 `MEMORY.md` 作為架構與長期記憶文件。
- 補齊 37 個台灣常用注音符號資料、例字與 emoji 暫代圖像。
- 新增 `assets/audio/audio-manifest.json` 統一管理真人錄音狀態。
- 將 192×192、512×512 與 Apple 180×180 PNG icon 改列下一階段待辦，本次保留 SVG icon。
- 新增 GitHub Actions 自動執行 PWA 與 JavaScript 檢查。

### Changed

- 更新音訊播放流程：只有 manifest 標示為真人錄音時才播放音檔，缺音時清楚標示語音合成備援。
- 更新 Service Worker cache 版本與離線核心檔案清單，並保留舊快取清除策略。
- 更新 README、PROGRESS、TASKS 與 DECISIONS，反映目前限制與下一步。

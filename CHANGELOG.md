# CHANGELOG.md

## V1.1.0 - 2026-07-19 13:49 Asia/Ho_Chi_Minh

### GitHub metadata correction

- PR #4: Merged; Head `codex/-cloudflare-workers`; Base `main`.
- 程式 Commit：`85f83e9f7d5f4fe477ab21042581df67ca77cf42`。
- Merge Commit：`60217f8293424eae8f64d663a845b21b3a5266d9`。
- GitHub Actions：Validate PWA；Workflow Run #8；結果 success。
- 本次功能分支尚未合併，最終 Merge Commit 不適用。

### Added

- 新增 App 統一版本資訊 `V1.1.0`、修改時間與時區。
- 新增注音分組瀏覽、回上面、拼一拼、初級／進階與聲調練習。
- 新增兒童主要文字 ruby 注音、點讀與估算逐字高亮。
- 新增家長模式注音顯示、聲音、音量與難度等 localStorage 設定。

### Changed

- 修正 iPhone／iPad Safari 注音字型，注音符號改用 `.zhuyin-symbol`，避免 900 超粗、傾斜、旋轉或 Emoji 字型影響。
- 37 個注音資料補齊 group、sampleWord、sampleZhuyin、emoji、audio 欄位。
- Service Worker cache 更新為 `zhuyin-bee-v1-1-0`，核心快取不包含不存在 MP3。

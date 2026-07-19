# PLAN.md

## V1.1.0 目標

建立更適合 iPhone／iPad Safari 的兒童注音學習體驗：標準注音字型、完整 37 符號、分組卡片、點讀、聲音備援、拼音與聲調練習。

## 設計原則

- 使用 HTML、CSS、JavaScript，不加入框架。
- 兒童介面以圖片、Emoji、符號與短文字優先，每個畫面只放一個主要任務。
- 注音符號統一使用 `.zhuyin-symbol`，避免 `font-weight: 900`、斜體、旋轉、直排與 Emoji 字型混用。
- 主要兒童中文使用人工確認 ruby／rt 注音，不自動猜多音字。
- 聲音採真人錄音優先，缺檔或失敗時才用 `zh-TW` 語音合成備援。
- 學習紀錄與設定只存在 localStorage，更新版本不得無故清空。

## 後續版本方向

- 補齊真人錄音檔並更新 audio manifest。
- 擴充詞庫與題型，但避免第一畫面塞入過多難度。
- 補正式 PNG PWA icon 與正式授權圖片素材。
- 在實體 iPhone／iPad Safari 驗收離線、加入主畫面、安全區與音訊行為。

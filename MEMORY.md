# MEMORY

- 專案是「小學生注音、認字與語音學習遊戲」PWA，主要支援 iPhone/iPad Safari。
- V1.3.0 版本來源在 `public/src/app.js` 的 `APP_VERSION`。
- Service Worker 導覽 request 不得寫入 Cache Storage；離線導覽 fallback 固定 `/offline.html`。
- 三位小孩固定：林芳伃/Lisa、林彥宇/Jack、林子齊/Kyky；profile 存在 localStorage。
- 家長上傳課本文件不得提交完整內容到 Git；DOCX/PDF 匯入需先進待確認。
- 掃描 PDF OCR 尚未完成，不得宣稱支援。
- V1.3.1 起正式品牌為「注音動物園」，三位小孩共用 `storybook-zoo` 主題。
- 注音聲調必須用 `parseZhuyinSyllable()` 拆出 `.zhuyin-tone`，不得放在直排最後一格。
- 兒童看圖認字只可使用 `reviewed: true` 且 `validationStatus: valid` 的同筆詞語媒體資料，不可即時 Google 搜圖。

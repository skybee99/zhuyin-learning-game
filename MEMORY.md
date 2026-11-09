# MEMORY

- 專案是「小學生注音、認字與語音學習遊戲」PWA，主要支援 iPhone/iPad Safari。
- V1.3.0 版本來源在 `public/src/app.js` 的 `APP_VERSION`。
- Service Worker 導覽 request 不得寫入 Cache Storage；離線導覽 fallback 固定 `/offline.html`。
- 三位小孩固定：孩子一/child-1、孩子二/child-2、孩子三/child-3；profile 存在 localStorage。
- 家長上傳課本文件不得提交完整內容到 Git；DOCX/PDF 匯入需先進待確認。
- 掃描 PDF OCR 尚未完成，不得宣稱支援。
- V1.3.1 起正式品牌為「注音動物園」，三位小孩共用 `storybook-zoo` 主題。
- 注音聲調必須用 `parseZhuyinSyllable()` 拆出 `.zhuyin-tone`，不得放在直排最後一格。
- 兒童看圖認字只可使用 `reviewed: true` 且 `validationStatus: valid` 的同筆詞語媒體資料，不可即時 Google 搜圖。

## 2026-11-09 candidate notes

V2.0.0 is a candidate. Current reviewed core data and historic pending materials are separate. Maintain original legacy bytes, use anonymous profiles, and distinguish localStorage from the IndexedDB ledger. Restore is scoped to profiles and local dictionary; ledger and curriculum snapshots are export-only in this iteration. Textbooks lack verified lesson sources; Apple-device and publication status must be evidenced separately.

## 自由探索追加

探索位置及外觀以匿名角色分開保存，與既有學習資料和 IndexedDB 帳本分離。修訂靜態資產時遞增 `assetRevision`，V2.0.0 資料版本維持相容。新版收費成立以畫面確認後的正式開始提交為界，預留逾時的恢復可回讀稽核。以同一 PR 的完整 CI 和新交付回執區分模擬視窗、Windows 瀏覽器和 Apple 真機。

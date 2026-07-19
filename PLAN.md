## V1.3.0 目標

穩定 iOS / iPadOS Safari PWA、重製「拼一拼」清楚度與判定、放大兒童閱讀介面、建立家長字庫管理入口，並規劃 Cloudflare D1 永久字庫。

## Phase 狀態

- Phase 1 P0 穩定性：完成 Service Worker redirect 修正、獨立 `offline.html`、V1.3.0 cache、更新提示與家長快取修復。
- Phase 2 P0 學習正確性：完成拼一拼固定題目結構、圖片/詞語/目標字/答案檢查、ID 判定、初級/進階區分與下一題顯示時機。
- Phase 3 P1 可讀性與語音：完成主功能文字放大、注音答案元件、按鈕語音分類與家長入口靜音。
- Phase 4 P1 字庫管理：完成家長模式本機字庫查看、搜尋入口、統計、手動新增、資料檢查、匯出入口與停用/變更紀錄資料結構。
- Phase 5 P1 D1 與文件匯入：完成 D1 schema、Worker API 最小骨架與文件匯入待確認流程說明；正式 Cloudflare database id、完整 DOCX/PDF 解析與安全登入需後續 PR。
- Phase 6 P2 個人化主題：完成 Lisa、Jack、Kyky 原創 CSS/Emoji 主題與簡潔模式。

## 後續版本方向

- 連接正式 Cloudflare D1 database id，執行 seed migration，補完整 API 測試。
- 完成真正 DOCX 與文字型 PDF parser；掃描 PDF OCR 仍不宣稱支援。
- 製作正式原創插圖、PNG PWA icons 與真人錄音。
- 實體 iPhone／iPad Safari 驗收加入主畫面、離線與更新流程。

## 已完成

- [x] 補寫 PR #7 merged metadata。
- [x] 更新版本為 V1.3.0。
- [x] Service Worker cache 更新為 `zhuyin-bee-v1-3-0`。
- [x] 導覽 request 不寫入 Cache Storage。
- [x] 新增 `public/offline.html` 作唯一導覽離線 fallback。
- [x] 新增 Service Worker 更新提示與 reload loop 防護。
- [x] 家長模式新增清除 App 快取功能且保留 localStorage。
- [x] 重做拼一拼題目畫面、說明、答案顯示與 ID 判定。
- [x] 新增飛機、嘴巴、喝水、褲子拼一拼資料一致性案例。
- [x] 放大首頁功能卡、國字注音與答案卡。
- [x] 小孩選擇卡中文名與英文名分行。
- [x] 按鈕語音依導航、內容播放與家長功能分類。
- [x] 家長模式新增字庫管理、統計、搜尋、手動新增、資料檢查與匯入/匯出入口。
- [x] 新增 D1 schema migration、Worker API 骨架、DATABASE.md、API.md。
- [x] 新增 Lisa、Jack、Kyky 原創 CSS/Emoji 主題與簡潔模式。
- [x] 更新測試與 Codex Context Engineering 文件。

## 待辦

- [ ] 使用者實體 iPhone／iPad 驗收 Safari 分頁、加入主畫面、離線與 V1.2.0 升級。
- [ ] 建立正式 Cloudflare D1 database id 並執行 seed migration。
- [ ] 完成完整家長登入權限與 session 管理。
- [ ] 完成真正 DOCX 與文字型 PDF parser；掃描 PDF OCR 暫不支援。
- [ ] 製作或匯入 37 個真人錄音檔。
- [ ] 製作正式原創插圖與 PNG PWA icons。
- [ ] 補真人錄音逐字時間戳以支援精準高亮。

## V1.3.1 已完成

- [x] 修正注音聲調 DOM 與 CSS 定位。
- [x] 修正 ㄢ、ㄣ 例字與 Emoji。
- [x] 補 37 注音例字審核欄位與檢查腳本。
- [x] 清理詞語「小／大／標準」污染並加入媒體審核欄位。
- [x] 統一品牌為「注音動物園」與 `storybook-zoo` 主題。
- [x] 更新 manifest、Service Worker cache 與文件。

## V1.3.1 尚待

- [ ] 實體 iPhone／iPad Safari、Chrome、加入主畫面 PWA 驗收。
- [ ] 正式原創動物插圖與授權圖片補登。

## V1.3.2 已完成

- [x] 新增嚴格資料模型欄位與 `media-map.json`、`questions.json`。
- [x] 看圖認字只使用已驗證題目、詞語與媒體關聯。
- [x] 重建核心看圖認字詞語資料，避免羊、喝水、ㄢ、ㄣ 等圖文注音錯配。
- [x] 首頁功能卡改成動物圖案 + 功能名稱，移除長副標題。
- [x] 放大注音與聲調並改善手機直式版面。
- [x] 家長模式新增備份中心與多類 JSON 匯出、匯入摘要預覽。
- [x] 更新 V1.3.2 版本與 Service Worker cache。

## V1.3.2 尚待

- [ ] 實體 iPhone Safari、iPhone Chrome、Zalo WebView、iPad Safari 驗收。
- [ ] 完成真正覆蓋/合併匯入寫入流程，目前先完成摘要、安全自動備份與人工確認入口。
- [ ] 補正式本地授權圖片與真人錄音檔。

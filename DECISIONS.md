## D014：V1.2.0 正式語音固定系統語音

- 日期：2026-07-19
- 決策：`AUDIO_MODE = system`，所有播放統一走 `speakSystemText()`。
- 原因：目前沒有真人錄音檔，避免兒童等待 MP3 失敗或看見技術錯誤。

## D015：保留真人錄音入口但不載入 missing MP3

- 日期：2026-07-19
- 決策：保留 audio manifest、audioKey 與 planned recording path；V1.2.0 不嘗試載入 missing MP3。
- 原因：支援未來錄音替換，同時維持目前穩定體驗。

## D016：三位小孩獨立 profile

- 日期：2026-07-19
- 決策：固定 child-1、child-2、child-3，使用 `zhuyin-profile-child-1`、`zhuyin-profile-child-2`、`zhuyin-profile-child-3`。
- 原因：避免兄弟姊妹共用星星、錯題與設定。

## D017：台灣課本式直排注音元件

- 日期：2026-07-19
- 決策：不用一般橫排 ruby 作主顯示，改用 `.phonetic-word`、`.phonetic-char`、`.bopomofo-vertical`。
- 原因：讓注音位於國字右側並由上往下，降低 Safari 字形錯位。

## D018：Service Worker 不快取 redirect

- 日期：2026-07-19
- 決策：導覽 Network First，`canCacheResponse()` 排除 redirect、opaque、跨來源與非 ok response。
- 原因：修正 iPhone Safari 可能出現的 service worker redirections 錯誤。

## D019：V1.3.0 導覽 response 一律不寫入 Cache Storage

- 日期：2026-07-19
- 決策：`event.request.mode === 'navigate'` 只走 Network First，失敗時回 `/offline.html`，不快取 `/`、`./` 或 `/index.html` 導覽 response。
- 原因：徹底避免 iOS Safari / 加入主畫面 App 收到由 Service Worker 供應的 redirected navigation response。

## D020：拼一拼以選項 ID 作主要判定

- 日期：2026-07-19
- 決策：每題建立 `correctOptionId`，按鈕只提交 `data-option-id`；`normalizeZhuyin()` 僅作資料驗證備援。
- 原因：避免直排、換行、聲調與 DOM 顯示文字造成選對判錯。

## D021：文字大小與注音大小採每位小孩 profile 保存

- 日期：2026-07-19
- 決策：`textSize`、`zhuyinSize` 與 `themeMode` 儲存在各小孩 localStorage profile。
- 原因：三位小孩年齡與閱讀需求不同，獨立保存能避免互相影響。

## D022：D1 先完成安全最小骨架與限制揭露

- 日期：2026-07-19
- 決策：新增 D1 schema、Worker API 與 parent session gate；正式 database id、完整登入、DOCX/PDF parser 與 seed migration 執行列為後續。
- 原因：避免用假 UI 冒充已完成永久保存，同時保留可安全演進的資料模型。

## D023：注音聲調獨立定位

- 日期：2026-07-19
- 決策：用 `parseZhuyinSyllable()` 拆出 `symbols`、`tone`、`toneMark`，DOM 中以 `.zhuyin-symbols` 與 `.zhuyin-tone` 分離。
- 原因：避免二、三、四聲與輕聲被當作直排最後一格，改善 iOS Safari/PWA 顯示一致性。

## D024：統一注音動物園主題

- 日期：2026-07-19
- 決策：child-1、child-2、child-3 共用 `storybook-zoo`，僅保留名字、頭像與本機學習紀錄差異。
- 原因：降低兒童操作混淆，移除小蜜蜂、公主、蜘蛛英雄與小勇者個別主題。

## D025：兒童題庫只使用已審核媒體

- 日期：2026-07-19
- 決策：詞語題目必須同筆資料包含 word、targetCharacter、targetIndex、speechText、image/emojiFallback、reviewed 與 validationStatus。
- 原因：避免陣列索引錯位與不明授權/不適齡圖片進入兒童模式。

## D026：看圖認字採已驗證題目池

- 日期：2026-07-19
- 決策：看圖認字只從 `questions.json` 中 `mode = 看圖認字` 且 `verified = true` 的題目建立題池，並反查通過 `validWordQuestion()` 的詞語與媒體關聯。
- 原因：避免圖片、詞語、注音來自不同陣列或臨時拼接造成錯配，確保兒童正式模式不顯示未審核資料。

## D027：備份匯入先做摘要與自動備份

- 日期：2026-07-19
- 決策：V1.3.2 先提供 JSON 匯入摘要、筆數、備份日期、合併/覆蓋選項與匯入前自動備份；正式寫入保留人工確認後演進。
- 原因：避免誤覆蓋兒童本機學習紀錄，同時先完成可驗證的備份安全流程。

## 2026-11-09 資料與版本決策

- V2.0.0 為候選版本，`public/src/version.js` 為版本識別來源；版本不代表已部署。
- 舊個人資料不刪除、不覆寫；使用匿名角色槽與新的本機文件。交易採 IndexedDB 原子操作。
- 資料匯入需差異預覽、家長確認及讀回的 PRE 快照，匯入只支援個人進度與本機字庫；交易及課程為快照匯出。
- 教材沒有課文內頁與來源前維持 WAITING_FOR_SOURCE；歷史字庫待審，不直接啟用。

## D028 自由探索的座標與輸入

採原生 CSS／SVG 與分離的世界幾何。網格 A*、半徑碰撞與步進限制共用同一世界資料。容器改變時調整鏡頭，保留角色比例與可操作目標。NPC 走點是非阻擋區，文本固定且只使用現有系統語音。

## D029 設施開始的收費界線

新版沿用同一 IndexedDB Ledger，先以唯一操作 ID 預留券，畫面可見且提交首次移動後記錄 `ride_paint_ack`，再以既有 `startRide` 提交正式開始。兩種預留階段均可取消或逾期退款。開始後費用成立。瀏覽器的可繪製機會不能證明實體螢幕顯示或人眼已看見。舊客戶端和舊帳本紀錄依原政策處理。

## D030 資產修訂獨立

版本字串 V2.0.0 同時參與資料匯入與答題識別，維持相容；HTML 查詢參數與 PWA Cache 使用 `assetRevision`。每次變更受快取資產均須遞增修訂。

## D031 V2.1.0 立體呈現與隔離

採本機 Three.js／WebGL2 為候選呈現層，保留既有 2D 作降級和離線學習入口；3D 擴充幾何與原 2D 世界隔離。人物、NPC 和場景使用專案程式生成的低多邊形素材；Three.js 上游版本和授權隨 bundle 記錄。Babylon.js 未在相同條件實測 bundle／FPS，不能把工程整合判斷當效能比較結論。詳細範圍與尚未執行項目見 `reports/3D-ARCHITECTURE.md`。

## D032 房間與本機交易邊界

私人房間只協調短期成員與場景狀態，不持有或跨設備合併學習進度及本機遊樂券；參與者各自確認並透過本機既有帳本交易。正式 Durable Objects 需核驗帳號權限、設定、成本和 staging，不可自行啟用正式資源。可見畫格確認與實際顯示之間仍有中斷窗口，不以客戶端訊號聲稱人眼已看見。權限、安全、共乘與斷線行為必須依實際測試結果分項報告。

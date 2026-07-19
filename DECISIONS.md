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
- 決策：固定 Lisa、Jack、Kyky，使用 `zhuyin-profile-lisa`、`zhuyin-profile-jack`、`zhuyin-profile-kyky`。
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
- 決策：Lisa、Jack、Kyky 共用 `storybook-zoo`，僅保留名字、頭像與本機學習紀錄差異。
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

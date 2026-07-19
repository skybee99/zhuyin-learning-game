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
